package com.mindease.admin.dto;

public record AnalyticsOverviewResponse(
    long dau,
    long mau,
    Double retention,
    Double churn
) {}

