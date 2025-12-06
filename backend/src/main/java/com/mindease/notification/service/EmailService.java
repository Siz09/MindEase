package com.mindease.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.MailException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;

import jakarta.mail.MessagingException;
import jakarta.mail.AuthenticationFailedException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${mindease.mail.from:noreply@mindease.com}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Retryable(maxAttempts = 3, include = { MailException.class, MessagingException.class })
    @Async
    public void sendEmail(String to, String subject, String text) {
        try {
            // ✅ Basic validation
            if (to == null || to.trim().isEmpty()) {
                throw new IllegalArgumentException("Recipient address cannot be null or empty");
            }
            if (subject == null || subject.trim().isEmpty()) {
                throw new IllegalArgumentException("Subject cannot be null or empty");
            }
            if (text == null) {
                throw new IllegalArgumentException("Email text cannot be null");
            }

            // ✅ Build message
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress); // Configured sender
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            // ✅ Send email
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);

        } catch (MailAuthenticationException e) {
            // Authentication failures are configuration issues, not critical errors
            logger.warn("Email authentication failed for: {}. Subject: {}. " +
                    "Please check EMAIL_USERNAME and EMAIL_PASSWORD environment variables. " +
                    "For Gmail, use an App Password if 2FA is enabled. Error: {}",
                    to, subject, e.getMessage());
            // Re-throw to trigger @Recover method
            throw e;
        } catch (MailException e) {
            // Other mail exceptions (network, invalid address, etc.)
            logger.error("Failed to send email to: {}. Subject: {}. Error: {}",
                    to, subject, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            // Unexpected errors - wrap in MailException for retry mechanism
            logger.error("Unexpected error sending email to: {}. Subject: {}. Error: {}",
                    to, subject, e.getMessage(), e);
            if (e instanceof MailException) {
                throw (MailException) e;
            }
            throw new MailException("Unexpected error: " + e.getMessage(), e) {
            };
        }
    }

    @Recover
    public void onEmailFail(Exception e, String to, String subject, String text) {
        if (e instanceof MailAuthenticationException ||
                (e.getCause() instanceof AuthenticationFailedException)) {
            logger.warn("Email permanently failed due to authentication issue for {} with subject '{}'. " +
                    "Crisis alerts will still be logged in the database and shown in admin dashboard. " +
                    "To enable email alerts, configure EMAIL_USERNAME and EMAIL_PASSWORD. " +
                    "For Gmail: https://support.google.com/accounts/answer/185833",
                    to, subject);
        } else {
            logger.error("Email permanently failed for {} with subject '{}': {}",
                    to, subject, e.getMessage(), e);
        }
        // Note: Crisis alerts are still logged in database and shown in admin dashboard
        // Email is just an additional notification channel
    }
}
