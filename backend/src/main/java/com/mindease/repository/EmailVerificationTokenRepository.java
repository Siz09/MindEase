package com.mindease.repository;

import com.mindease.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    /**
     * Find a verification token by its token string
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Find the most recent valid token for an email
     */
    @Query("SELECT t FROM EmailVerificationToken t WHERE t.email = :email AND t.usedAt IS NULL AND t.expiresAt > :now ORDER BY t.createdAt DESC")
    Optional<EmailVerificationToken> findValidTokenByEmail(String email, LocalDateTime now);

    /**
     * Delete expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);

    /**
     * Delete used tokens older than a certain date (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.usedAt IS NOT NULL AND t.usedAt < :cutoffDate")
    int deleteOldUsedTokens(LocalDateTime cutoffDate);
}
