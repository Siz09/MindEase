package com.mindease.admin.dto;

public record ApiKeyInfo(
    String id,
    String label,
    String last4,
    boolean configured
) {}

