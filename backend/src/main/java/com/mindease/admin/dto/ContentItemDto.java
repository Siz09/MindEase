package com.mindease.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContentItemDto(
    UUID id,
    String title,
    String description,
    String category,
    String type,
    String imageUrl,
    Double rating,
    Integer reviewCount,
    OffsetDateTime createdAt
) {}

