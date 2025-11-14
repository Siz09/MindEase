package com.mindease.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserAdminSummary(
    UUID id,
    String email,
    String status,
    OffsetDateTime createdAt,
    OffsetDateTime lastActive,
    long crisisFlags
) {}
