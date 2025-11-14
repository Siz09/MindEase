package com.mindease.dto;

import java.time.OffsetDateTime;

public record AuditLogSearchRequest(
    String email,
    String actionType,
    OffsetDateTime from,
    OffsetDateTime to,
    Integer page,
    Integer size
) {}

