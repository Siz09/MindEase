package com.mindease.service;

import com.mindease.model.PasswordResetRequest;
import com.mindease.model.RefreshToken;
import com.mindease.repository.PasswordResetRequestRepository;
import com.mindease.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing password reset requests, including rate limiting and security monitoring.
 */
@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    private final PasswordResetRequestRepository passwordResetRequestRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${password-reset.rate-limit.max-per-email:3}")
    private int maxRequestsPerEmail;

    @Value("${password-reset.rate-limit.max-per-ip:5}")
    private int maxRequestsPerIp;

    @Value("${password-reset.rate-limit.window-hours:1}")
    private int rateLimitWindowHours;

    @Value("${password-reset.retention-days:30}")
    private int retentionDays;

    public PasswordResetService(
            PasswordResetRequestRepository passwordResetRequestRepository,
            RefreshTokenRepository refreshTokenRepository) {
        this.passwordResetRequestRepository = passwordResetRequestRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /**
     * Record a password reset request for tracking and rate limiting.
     *
     * @param email       User's email address
     * @param ipAddress   Request IP address
     * @param userAgent   Request user agent
     * @return The created PasswordResetRequest
     */
    @Transactional
    public PasswordResetRequest recordResetRequest(String email, String ipAddress, String userAgent) {
        PasswordResetRequest request = new PasswordResetRequest(email, ipAddress, userAgent);
        PasswordResetRequest saved = passwordResetRequestRepository.save(request);

        logger.info("Password reset requested for email: {} from IP: {}", email, ipAddress);

        return saved;
    }

    /**
     * Mark a password reset as completed and revoke all refresh tokens for security.
     *
     * @param email User's email address
     */
    @Transactional
    public void recordResetCompletion(String email) {
        // Mark the most recent uncompleted request as completed
        List<PasswordResetRequest> uncompletedRequests =
            passwordResetRequestRepository.findUncompletedByEmail(email);

        if (!uncompletedRequests.isEmpty()) {
            PasswordResetRequest request = uncompletedRequests.get(0);
            request.setCompleted(true);
            request.setCompletedAt(LocalDateTime.now());
            passwordResetRequestRepository.save(request);
        }

        // Revoke all refresh tokens for this email for security
        List<RefreshToken> tokens = refreshTokenRepository.findByUserEmail(email);
        if (!tokens.isEmpty()) {
            refreshTokenRepository.deleteAll(tokens);
            logger.info("Revoked {} refresh tokens for user {} after password reset", tokens.size(), email);
        }

        logger.info("Password reset completed for email: {}", email);
    }

    /**
     * Check if the rate limit has been exceeded for password reset requests.
     *
     * @param email     User's email address
     * @param ipAddress Request IP address
     * @return true if rate limit exceeded, false otherwise
     */
    public boolean isRateLimitExceeded(String email, String ipAddress) {
        LocalDateTime windowStart = LocalDateTime.now().minusHours(rateLimitWindowHours);

        // Check email rate limit
        long emailCount = passwordResetRequestRepository.countByEmailSince(email, windowStart);
        if (emailCount >= maxRequestsPerEmail) {
            logger.warn("Rate limit exceeded for email: {} ({} requests in {} hour(s))",
                email, emailCount, rateLimitWindowHours);
            return true;
        }

        // Check IP rate limit
        long ipCount = passwordResetRequestRepository.countByIpAddressSince(ipAddress, windowStart);
        if (ipCount >= maxRequestsPerIp) {
            logger.warn("Rate limit exceeded for IP: {} ({} requests in {} hour(s))",
                ipAddress, ipCount, rateLimitWindowHours);
            return true;
        }

        return false;
    }

    /**
     * Get all password reset requests for an email (for admin/debugging).
     *
     * @param email User's email address
     * @return List of password reset requests
     */
    public List<PasswordResetRequest> getRequestsByEmail(String email) {
        return passwordResetRequestRepository.findByEmail(email);
    }

    /**
     * Get all password reset requests from an IP address (for admin/debugging).
     *
     * @param ipAddress IP address
     * @return List of password reset requests
     */
    public List<PasswordResetRequest> getRequestsByIpAddress(String ipAddress) {
        return passwordResetRequestRepository.findByIpAddress(ipAddress);
    }

    /**
     * Scheduled cleanup of old password reset requests.
     * Runs daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldRequests() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);

        try {
            passwordResetRequestRepository.deleteOldRequests(cutoffDate);
            logger.info("Cleaned up password reset requests older than {} days", retentionDays);
        } catch (Exception e) {
            logger.error("Error cleaning up old password reset requests", e);
        }
    }
}
