package com.mindease.admin.repository;

import com.mindease.admin.model.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditLogRepositoryCustom {
    Slice<AuditLog> findByFilters(UUID userId,
                                  String actionType,
                                  OffsetDateTime from,
                                  OffsetDateTime to,
                                  Pageable pageable);
}

