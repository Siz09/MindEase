package com.mindease.service;

import com.mindease.model.EmailVerificationToken;
import com.mindease.model.User;
import com.mindease.repository.EmailVerificationTokenRepository;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);

    /**
     * Mask email address for logging to reduce PII exposure
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@"))
            return "***";
        int atIndex = email.indexOf("@");
        return email.substring(0, Math.min(2, atIndex)) + "***" + email.substring(atIndex);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    /**
     * Send verification email to user
     */
    @Transactional
    public void sendVerificationEmail(User user) {
        if (user == null || user.getEmail() == null) {
            throw new IllegalArgumentException("User and email cannot be null");
        }

        if (user.isEmailVerified()) {
            logger.debug("Email already verified for user: {}", maskEmail(user.getEmail()));
            return;
        }

        // Skip email verification for anonymous users
        if (user.getAnonymousMode() != null && user.getAnonymousMode()) {
            logger.debug("Skipping email verification for anonymous user: {}", maskEmail(user.getEmail()));
            return;
        }

        // Generate and store verification token in database
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24); // 24 hours

        EmailVerificationToken verificationToken = new EmailVerificationToken(token, user.getEmail(), expiresAt);
        tokenRepository.save(verificationToken);

        // Send email
        if (mailSender != null && fromEmail != null && !fromEmail.isEmpty()) {
            try {
                String verificationLink = appBaseUrl + "/verify-email?token=" + token;

                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(user.getEmail());
                message.setSubject("Verify your MindEase email address");
                message.setText(
                        "Hello,\n\n" +
                                "Thank you for registering with MindEase!\n\n" +
                                "Please verify your email address by clicking the link below:\n" +
                                verificationLink + "\n\n" +
                                "This link will expire in 24 hours.\n\n" +
                                "If you didn't create an account with MindEase, please ignore this email.\n\n" +
                                "Best regards,\n" +
                                "The MindEase Team");

                mailSender.send(message);
                logger.info("Verification email sent to: {}", maskEmail(user.getEmail()));
            } catch (Exception e) {
                logger.error("Failed to send verification email to: {}", maskEmail(user.getEmail()), e);
                throw new RuntimeException("Failed to send verification email", e);
            }
        } else {
            logger.warn("Email service not configured. Verification email not sent to: {}", maskEmail(user.getEmail()));
            // In development, use a dedicated mechanism for token retrieval
            if (logger.isDebugEnabled()) {
                logger.debug("DEV ONLY - Verification token generated for testing");
            }
        }
    }

    /**
     * Verify email with token
     */
    @Transactional
    public boolean verifyEmail(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        EmailVerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElse(null);

        if (verificationToken == null) {
            logger.warn("Invalid verification token: {}", token);
            return false;
        }

        if (verificationToken.isExpired()) {
            logger.warn("Expired verification token for email: {}", maskEmail(verificationToken.getEmail()));
            return false;
        }

        if (verificationToken.isUsed()) {
            logger.warn("Verification token already used for email: {}", maskEmail(verificationToken.getEmail()));
            return false;
        }

        User user = userRepository.findByEmail(verificationToken.getEmail())
                .orElse(null);

        if (user == null) {
            logger.warn("User not found for verification token: {}", maskEmail(verificationToken.getEmail()));
            return false;
        }

        // Mark token as used
        verificationToken.setUsedAt(LocalDateTime.now());
        tokenRepository.save(verificationToken);

        // Mark email as verified
        user.setEmailVerified(true);
        userRepository.save(user);

        logger.info("Email verified successfully for user: {}", maskEmail(user.getEmail()));
        return true;
    }

    /**
     * Scheduled job to clean up expired and old used tokens
     * Runs daily at 4 AM
     */
    @Scheduled(cron = "0 0 4 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        logger.info("Starting cleanup of expired email verification tokens");

        // Delete expired tokens
        int expiredCount = tokenRepository.deleteExpiredTokens(LocalDateTime.now());
        logger.info("Deleted {} expired verification tokens", expiredCount);

        // Delete used tokens older than 7 days
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        int oldUsedCount = tokenRepository.deleteOldUsedTokens(cutoffDate);
        logger.info("Deleted {} old used verification tokens", oldUsedCount);
    }

    /**
     * Check if user's email is verified
     */
    public boolean isEmailVerified(User user) {
        return user != null && user.isEmailVerified();
    }
}
