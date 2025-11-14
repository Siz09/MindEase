package com.mindease.dto;

import java.time.OffsetDateTime;

public record ErrorSummary(
    String code,
    long count,
    OffsetDateTime lastOccurred
) {}

