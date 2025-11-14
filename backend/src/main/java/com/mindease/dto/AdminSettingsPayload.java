package com.mindease.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record AdminSettingsPayload(
    @Min(1) @Max(10) int crisisThreshold,
    @Pattern(regexp = "all|critical|none") String emailNotifications,
    boolean autoArchive,
    @Min(1) @Max(365) Integer autoArchiveDays,
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$") String dailyReportTime
) {}
