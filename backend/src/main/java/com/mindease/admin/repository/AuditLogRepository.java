package com.mindease.admin.repository;

import com.mindease.admin.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, AuditLogRepositoryCustom {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Slice<AuditLog> findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID userId, String actionType, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    Page<AuditLog> findByActionTypeOrderByCreatedAtDesc(String actionType, Pageable pageable);

    Page<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime from, OffsetDateTime to,
                                                              Pageable pageable);

    @Query("SELECT a.userId, MAX(a.createdAt) FROM AuditLog a WHERE a.userId IN :userIds GROUP BY a.userId")
    List<Object[]> findLastActiveByUserIds(@Param("userIds") List<UUID> userIds);
}

