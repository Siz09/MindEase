package com.mindease.dto;

public record AnalyticsOverviewResponse(
    long dau,
    long mau,
    double retention,
    double churn
) {}

