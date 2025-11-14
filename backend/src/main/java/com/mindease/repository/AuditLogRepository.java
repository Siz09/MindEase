package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, AuditLogRepositoryCustom {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Slice<AuditLog> findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
        UUID userId, String actionType, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);

    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    @Query("SELECT a.userId, MAX(a.createdAt) FROM AuditLog a WHERE a.userId IN :userIds GROUP BY a.userId")
    java.util.List<Object[]> findLastActiveByUserIds(@Param("userIds") java.util.List<UUID> userIds);
}
