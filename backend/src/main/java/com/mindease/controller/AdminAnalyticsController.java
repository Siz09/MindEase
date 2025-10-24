package com.mindease.controller;

import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.AiUsagePoint;
import com.mindease.dto.MoodCorrelationPoint;
import com.mindease.repository.AnalyticsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Analytics")
public class AdminAnalyticsController {

    private final AnalyticsRepository analytics;

    public AdminAnalyticsController(AnalyticsRepository analytics) {
        this.analytics = analytics;
    }

    private static OffsetDateTime defaultFrom() {
        return OffsetDateTime.now(ZoneOffset.UTC).minusDays(14).withHour(0).withMinute(0).withSecond(0).withNano(0);
    }

    private static OffsetDateTime defaultTo() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    @GetMapping("/active-users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Daily active users", description = "Distinct users per day over the date range")
    public List<ActiveUsersPoint> activeUsers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        var f = from != null ? from : defaultFrom();
        var t = to != null ? to : defaultTo();
        return analytics.dailyActiveUsers(f, t);
    }

    @GetMapping("/ai-usage")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "AI usage", description = "Number of AI/chat calls per day over the date range")
    public List<AiUsagePoint> aiUsage(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        var f = from != null ? from : defaultFrom();
        var t = to != null ? to : defaultTo();
        return analytics.dailyAiUsage(f, t);
    }

    @GetMapping("/mood-correlation")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mood correlation", description = "Avg mood per day and chat counts for correlation analysis")
    public List<MoodCorrelationPoint> moodCorrelation(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        var f = from != null ? from : defaultFrom();
        var t = to != null ? to : defaultTo();
        return analytics.moodCorrelation(f, t);
    }
}

