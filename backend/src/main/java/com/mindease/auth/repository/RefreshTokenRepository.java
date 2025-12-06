package com.mindease.auth.repository;

import com.mindease.auth.model.RefreshToken;
import com.mindease.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    /**
     * Find a refresh token by its token string
     */
    Optional<RefreshToken> findByToken(String token);

    /**
     * Find all refresh tokens for a user
     */
    List<RefreshToken> findByUser(User user);

    /**
     * Find all refresh tokens by user email
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.email = :email")
    List<RefreshToken> findByUserEmail(String email);

    /**
     * Find all valid (non-revoked, non-expired) refresh tokens for a user
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.expiresAt > :now")
    List<RefreshToken> findValidTokensByUser(User user, LocalDateTime now);

    /**
     * Delete all refresh tokens for a user (used during logout)
     */
    void deleteByUser(User user);

    /**
     * Delete expired refresh tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);

    /**
     * Revoke all refresh tokens for a user
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :now WHERE rt.user = :user AND rt.revoked = false")
    int revokeAllTokensForUser(User user, LocalDateTime now);
}
