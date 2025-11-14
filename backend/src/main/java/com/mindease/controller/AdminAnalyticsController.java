package com.mindease.controller;

import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.AiUsagePoint;
import com.mindease.dto.AnalyticsOverviewResponse;
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
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Analytics")
public class AdminAnalyticsController {

    private final AnalyticsRepository analytics;

    public AdminAnalyticsController(AnalyticsRepository analytics) {
        this.analytics = analytics;
    }

    private static final long MAX_RANGE_DAYS = 365;

    private static OffsetDateTime defaultFrom() {
        return OffsetDateTime.now(ZoneOffset.UTC).minusDays(14).truncatedTo(ChronoUnit.DAYS);
    }

    private static OffsetDateTime defaultTo() {
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    private static void validateDateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must not be after 'to'");
        }
        long daysBetween = ChronoUnit.DAYS.between(from.toLocalDate(), to.toLocalDate());
        if (daysBetween > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException("Date range must not exceed " + MAX_RANGE_DAYS + " days");
        }
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
        validateDateRange(f, t);
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
        validateDateRange(f, t);
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
        validateDateRange(f, t);
        return analytics.moodCorrelation(f, t);
    }

    @GetMapping("/analytics/overview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Analytics overview", description = "High-level analytics metrics used by the admin UI")
    public AnalyticsOverviewResponse overview(
            @RequestParam(defaultValue = "30d") String range
    ) {
        OffsetDateTime to = defaultTo();
        OffsetDateTime from;
        switch (range) {
            case "7d" -> from = to.minusDays(7);
            case "90d" -> from = to.minusDays(90);
            case "1y" -> from = to.minusDays(365);
            case "30d" -> {
                from = to.minusDays(30);
            }
            default -> from = to.minusDays(30);
        }
        validateDateRange(from, to);

        // DAU: last day active users
        var dauSeries = analytics.dailyActiveUsers(to.minusDays(1), to);
        long dau = dauSeries.isEmpty() ? 0L : dauSeries.get(dauSeries.size() - 1).activeUsers();

        // MAU: distinct users active at least once during the window
        long mau = analytics.distinctActiveUsers(from, to);

        // Retention / churn: real implementation would require cohort analysis
        Double retention = null;
        Double churn = null;

        return new AnalyticsOverviewResponse(dau, mau, retention, churn);
    }

    @GetMapping("/analytics/user-growth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "User growth", description = "Alias for daily active users over the requested range")
    public List<ActiveUsersPoint> userGrowth(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        var f = from != null ? from : defaultFrom();
        var t = to != null ? to : defaultTo();
        validateDateRange(f, t);
        return analytics.dailyActiveUsers(f, t);
    }

    @GetMapping("/analytics/feature-usage")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Feature usage", description = "Placeholder endpoint for feature usage analytics")
    public java.util.Map<String, Object> featureUsage() {
        return java.util.Map.of(
                "status", "not_implemented",
                "message", "Feature usage analytics not yet implemented."
        );
    }

    @GetMapping("/analytics/crisis-trends")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crisis trends", description = "Placeholder endpoint for crisis trend analytics")
    public java.util.List<java.util.Map<String, Object>> crisisTrends() {
        // For now, return an empty list; the current UI only shows a placeholder chart.
        return java.util.List.of();
    }

    @GetMapping("/analytics/export")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Export analytics", description = "Export analytics data (stub implementation)")
    public java.util.Map<String, String> export() {
        return java.util.Map.of("status", "not_implemented", "message", "Analytics export is not yet implemented.");
    }
}
