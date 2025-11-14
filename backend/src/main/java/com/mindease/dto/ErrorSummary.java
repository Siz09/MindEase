package com.mindease.dto;

import java.time.OffsetDateTime;

public record ErrorSummary(
    String code,
    long count,
    OffsetDateTime lastOccurred
) {
    public ErrorSummary {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Error code cannot be null or blank");
        }
        if (count < 0) {
            throw new IllegalArgumentException("Count cannot be negative");
        }
        if (lastOccurred == null) {
            throw new IllegalArgumentException("Last occurred timestamp cannot be null");
        }
    }
}
