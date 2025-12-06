package com.mindease.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RecentAlertDto(
    UUID id,
    String title,
    String message,
    OffsetDateTime timestamp,
    UUID userId
) {}

