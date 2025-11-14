package com.mindease.dto;

public record AnalyticsOverviewResponse(
    long dau,
    long mau,
    Double retention,
    Double churn
) {}
