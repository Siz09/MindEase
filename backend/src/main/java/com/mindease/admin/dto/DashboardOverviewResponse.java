package com.mindease.admin.dto;

public record DashboardOverviewResponse(
        long activeUsers,
        long signupsToday,
        long crisisLast24h,
        long aiCallsLast24h,
        Double activeUsersTrend,
        Double signupsTrend,
        Double crisisTrend,
        Double aiUsageTrend) {
}

