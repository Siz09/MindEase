package com.mindease.service;

import com.mindease.model.RefreshToken;
import com.mindease.model.User;
import com.mindease.repository.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration:604800000}") // Default: 7 days in milliseconds
    private Long refreshTokenDuration;

    /**
     * Create a new refresh token for a user
     */
    public RefreshToken createRefreshToken(User user) {
        // Generate a secure random token
        String token = UUID.randomUUID().toString();

        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenDuration / 1000);

        RefreshToken refreshToken = new RefreshToken(token, user, expiresAt);
        refreshToken = refreshTokenRepository.save(refreshToken);

        logger.debug("Created refresh token for user ID: {}", user.getId());
        return refreshToken;
    }

    /**
     * Find a refresh token by its token string
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Verify and return a valid refresh token
     *
     * @throws RuntimeException if token is invalid, expired, or revoked
     */
    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (refreshToken.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        if (refreshToken.isExpired()) {
            // Delete expired token
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token has expired. Please log in again.");
        }

        return refreshToken;
    }

    /**
     * Revoke a specific refresh token
     */
    public void revokeToken(RefreshToken token) {
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        logger.debug("Revoked refresh token: {}", token.getId());
    }

    /**
     * Revoke all refresh tokens for a user (used during logout or password change)
     */
    public int revokeAllUserTokens(User user) {
        int count = refreshTokenRepository.revokeAllTokensForUser(user, LocalDateTime.now());
        logger.info("Revoked {} refresh tokens for user ID: {}", count, user.getId());
        return count;
    }

    /**
     * Delete all refresh tokens for a user
     */
    public void deleteAllUserTokens(User user) {
        refreshTokenRepository.deleteByUser(user);
        logger.info("Deleted all refresh tokens for user ID: {}", user.getId());
    }

    /**
     * Scheduled job to clean up expired refresh tokens
     * Runs daily at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupExpiredTokens() {
        logger.info("Starting cleanup of expired refresh tokens");
        int deletedCount = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        logger.info("Cleaned up {} expired refresh tokens", deletedCount);
    }
}
