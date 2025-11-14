package com.mindease.dto;

public record AdminSettingsPayload(
    int crisisThreshold,
    String emailNotifications,
    boolean autoArchive,
    Integer autoArchiveDays,
    String dailyReportTime
) {}

