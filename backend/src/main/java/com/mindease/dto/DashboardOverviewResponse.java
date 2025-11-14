package com.mindease.dto;

public record DashboardOverviewResponse(
    long activeUsers,
    Long dailySignups,
    Long crisisFlags,
    Long aiUsage,
    Double activeUsersTrend,
    Double dailySignupsTrend,
    Double crisisFlagsTrend,
    Double aiUsageTrend
) {}

