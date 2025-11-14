package com.mindease.dto;

public record ApiKeyInfo(
    String id,
    String label,
    String last4,
    boolean configured
) {}

