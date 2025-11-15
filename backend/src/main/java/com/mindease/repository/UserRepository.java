// backend/src/main/java/com/mindease/repository/UserRepository.java
package com.mindease.repository;

import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.mindease.model.Role;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByFirebaseUid(String firebaseUid);

    boolean existsByEmail(String email);

    boolean existsByFirebaseUid(String firebaseUid);

    List<User> findByRole(Role role);

    Page<User> findByEmailContainingIgnoreCaseAndDeletedAtIsNull(String email, Pageable pageable);

    Page<User> findByDeletedAtIsNull(Pageable pageable);

    Page<User> findByEmailContainingIgnoreCaseAndDeletedAtIsNullAndBannedTrue(String email, Pageable pageable);

    Page<User> findByDeletedAtIsNullAndBannedTrue(Pageable pageable);

    Optional<User> findByEmailIgnoreCase(String email);

    long countByDeletedAtIsNull();

    long countByDeletedAtIsNullAndBannedTrue();

    Page<User> findByDeletedAtIsNullAndBannedFalse(Pageable pageable);

    @Query("SELECT COUNT(DISTINCT u.id) FROM User u " +
            "WHERE u.deletedAt IS NULL AND u.banned = false " +
            "AND EXISTS (SELECT 1 FROM AuditLog a WHERE a.userId = u.id AND a.createdAt >= :threshold)")
    long countActiveNonBannedUsers(@Param("threshold") OffsetDateTime threshold);
}
