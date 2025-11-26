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
 * Service for managing password reset requests, including rate limiting and
 * security monitoring.
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
     * @param email     User's email address
     * @param ipAddress Request IP address
     * @param userAgent Request user agent
     * @return The created PasswordResetRequest
     * @throws IllegalArgumentException if email is invalid
     */
    @Transactional
    public PasswordResetRequest recordResetRequest(String email, String ipAddress, String userAgent) {
        // Validate email format before recording to prevent rate limit exhaustion
        if (email == null || email.trim().isEmpty() || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            throw new IllegalArgumentException("Invalid email address");
        }

        PasswordResetRequest request = new PasswordResetRequest(email, ipAddress, userAgent);
        PasswordResetRequest saved = passwordResetRequestRepository.save(request);

        logger.info("Password reset requested for email hash: {} from IP: {}",
                Integer.toHexString(email.hashCode()), ipAddress);

        return saved;
    }

    /**
     * Mark a password reset as completed and revoke all refresh tokens for
     * security. Only processes if there's a recent (within 1 hour) uncompleted
     * request.
     *
     * @param email User's email address
     * @return true if a valid reset request was found and processed, false
     *         otherwise
     */
    @Transactional
    public boolean recordResetCompletion(String email) {
        // Only process if there's a recent uncompleted request (within 1 hour)
        // This prevents unauthorized token revocation attacks
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        List<PasswordResetRequest> recentUncompletedRequests = passwordResetRequestRepository
                .findRecentUncompletedByEmail(email, oneHourAgo);

        if (recentUncompletedRequests.isEmpty()) {
            logger.warn("Password reset confirmation attempted for email hash: {} but no recent valid request found",
                    Integer.toHexString(email.hashCode()));
            return false;
        }

        // Mark the most recent uncompleted request as completed
        PasswordResetRequest request = recentUncompletedRequests.get(0);
        request.setCompleted(true);
        request.setCompletedAt(LocalDateTime.now());
        passwordResetRequestRepository.save(request);

        // Revoke all refresh tokens for this email for security
        List<RefreshToken> tokens = refreshTokenRepository.findByUserEmail(email);
        if (!tokens.isEmpty()) {
            refreshTokenRepository.deleteAll(tokens);
            logger.info("Revoked {} refresh tokens for user hash: {} after password reset",
                    tokens.size(), Integer.toHexString(email.hashCode()));
        }

        logger.info("Password reset completed for email hash: {}", Integer.toHexString(email.hashCode()));
        return true;
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
            logger.warn("Rate limit exceeded for email hash: {} ({} requests in {} hour(s))",
                    Integer.toHexString(email.hashCode()), emailCount, rateLimitWindowHours);
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
