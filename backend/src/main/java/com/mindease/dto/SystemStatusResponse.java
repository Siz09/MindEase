package com.mindease.dto;

public record SystemStatusResponse(
    String apiStatus,
    String database,
    String aiEngine
) {}

