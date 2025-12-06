package com.mindease.admin.dto;

public record SystemStatusResponse(
    String apiStatus,
    String database,
    String aiEngine
) {}

