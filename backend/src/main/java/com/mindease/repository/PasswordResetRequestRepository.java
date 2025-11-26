package com.mindease.repository;

import com.mindease.model.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

    /**
     * Count password reset requests by email within a time window.
     */
    @Query("SELECT COUNT(p) FROM PasswordResetRequest p WHERE p.email = :email AND p.requestedAt >= :since")
    long countByEmailSince(@Param("email") String email, @Param("since") LocalDateTime since);

    /**
     * Count password reset requests by IP address within a time window.
     */
    @Query("SELECT COUNT(p) FROM PasswordResetRequest p WHERE p.ipAddress = :ipAddress AND p.requestedAt >= :since")
    long countByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Find all password reset requests by email.
     */
    List<PasswordResetRequest> findByEmail(String email);

    /**
     * Find all password reset requests by IP address.
     */
    List<PasswordResetRequest> findByIpAddress(String ipAddress);

    /**
     * Delete old password reset requests (for cleanup).
     */
    @Modifying
    @Query("DELETE FROM PasswordResetRequest p WHERE p.requestedAt < :before")
    void deleteOldRequests(@Param("before") LocalDateTime before);

    /**
     * Find the most recent uncompleted request by email.
     */
    @Query("SELECT p FROM PasswordResetRequest p WHERE p.email = :email AND p.completed = false ORDER BY p.requestedAt DESC")
    List<PasswordResetRequest> findUncompletedByEmail(@Param("email") String email);
}
