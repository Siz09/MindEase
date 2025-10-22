package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Slice<AuditLog> findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
        UUID userId, String actionType, OffsetDateTime from, OffsetDateTime to, Pageable pageable);
}
