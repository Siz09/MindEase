package com.mindease.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.MailException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;

import jakarta.mail.MessagingException;

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

        } catch (Exception e) {
            logger.error("Failed to send email to: {}. Subject: {}", to, subject, e);
        }
    }

    @Recover
    public void onEmailFail(Exception e, String to, String subject, String text) {
        logger.error("Email permanently failed for {} with subject '{}': {}", to, subject, e.getMessage(), e);
        // Optionally persist a failed status for operational visibility
    }
}
