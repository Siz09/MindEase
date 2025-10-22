package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AuditLog> findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
        UUID userId, String actionType, OffsetDateTime from, OffsetDateTime to);
}

