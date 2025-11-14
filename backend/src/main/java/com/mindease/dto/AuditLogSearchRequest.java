package com.mindease.dto;

import java.time.OffsetDateTime;

public record AuditLogSearchRequest(
    String email,
    String actionType,
    OffsetDateTime from,
    OffsetDateTime to,
    Integer page,
    Integer size
) {
    public AuditLogSearchRequest {
        if (page != null && page < 0) {
            throw new IllegalArgumentException("page must be non-negative");
        }
        if (size != null && size < 1) {
            throw new IllegalArgumentException("size must be positive");
        }
        if (size != null && size > 1000) {
            throw new IllegalArgumentException("size must not exceed 1000");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("'from' date must not be after 'to' date");
        }
    }
}
