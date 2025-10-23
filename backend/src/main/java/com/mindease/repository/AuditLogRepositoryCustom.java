package com.mindease.repository;

import com.mindease.model.AuditLog;
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

