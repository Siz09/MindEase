package com.mindease.controller;

import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.DashboardOverviewResponse;
import com.mindease.dto.KeywordStat;
import com.mindease.dto.RecentAlertDto;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.AnalyticsRepository;
import com.mindease.repository.CrisisFlagRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@Tag(name = "Admin Dashboard")
public class AdminDashboardController {

    private final AnalyticsRepository analyticsRepository;
    private final CrisisFlagRepository crisisFlagRepository;

    public AdminDashboardController(AnalyticsRepository analyticsRepository,
                                    CrisisFlagRepository crisisFlagRepository) {
        this.analyticsRepository = analyticsRepository;
        this.crisisFlagRepository = crisisFlagRepository;
    }

    private static OffsetDateTime nowUtc() {
        return OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    }

    private static OffsetDateTime daysAgoUtc(long days) {
        return nowUtc().minusDays(days);
    }

    private static OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Dashboard KPIs", description = "High-level metrics for the admin dashboard")
    public DashboardOverviewResponse overview() {
        OffsetDateTime to = nowUtc();
        OffsetDateTime from28 = to.minusDays(28);

        // Active users and AI usage over the last 28 days for simple trend calc
        List<ActiveUsersPoint> activeLast28 = analyticsRepository.dailyActiveUsers(from28, to);
        var aiLast28 = analyticsRepository.dailyAiUsage(from28, to);

        // Helper to get last and previous values
        long activeMostRecent = activeLast28.isEmpty() ? 0L : activeLast28.get(activeLast28.size() - 1).activeUsers();
        long activePrevious = activeLast28.size() < 2 ? 0L : activeLast28.get(activeLast28.size() - 2).activeUsers();

        long aiMostRecent = aiLast28.isEmpty() ? 0L : aiLast28.get(aiLast28.size() - 1).calls();
        long aiPrevious = aiLast28.size() < 2 ? 0L : aiLast28.get(aiLast28.size() - 2).calls();

        Double activeTrend = percentChange(activePrevious, activeMostRecent);
        Double aiTrend = percentChange(aiPrevious, aiMostRecent);

        // Daily signups: number of users created today vs yesterday
        LocalDate today = to.toLocalDate();
        LocalDate yesterday = today.minusDays(1);
        long signupsToday = analyticsRepository.countUsersCreatedBetween(
                startOfDay(today),
                startOfDay(today.plusDays(1))
        );
        long signupsYesterday = analyticsRepository.countUsersCreatedBetween(
                startOfDay(yesterday),
                startOfDay(today)
        );
        Double signupsTrend = percentChange(signupsYesterday, signupsToday);

        // Crisis flags last 24h vs previous 24h
        OffsetDateTime last24From = to.minusHours(24);
        OffsetDateTime prev24From = to.minusHours(48);
        long crisisLast24 = crisisFlagRepository.countByCreatedAtBetween(last24From, to);
        long crisisPrev24 = crisisFlagRepository.countByCreatedAtBetween(prev24From, last24From);
        Double crisisTrend = percentChange(crisisPrev24, crisisLast24);

        return new DashboardOverviewResponse(
                activeMostRecent,
                signupsToday,
                crisisLast24,
                aiMostRecent,
                activeTrend,
                signupsTrend,
                crisisTrend,
                aiTrend
        );
    }

    private static Double percentChange(long previous, long current) {
        if (previous <= 0L) {
            return null;
        }
        double diff = current - previous;
        return (diff / (double) previous) * 100.0;
    }

    @GetMapping("/activity-trend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "User activity trend", description = "Daily active users for the last 30 days")
    public List<ActiveUsersPoint> activityTrend(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        OffsetDateTime t = to != null ? to : nowUtc();
        OffsetDateTime f = from != null ? from : t.minusDays(30);
        long daysBetween = ChronoUnit.DAYS.between(f, t);
        if (daysBetween > 365 || daysBetween < 0) {
            throw new IllegalArgumentException("Date range must be between 0 and 365 days");
        }
        return analyticsRepository.dailyActiveUsers(f, t);
    }

    @GetMapping("/recent-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Recent alerts", description = "Recent crisis alerts used for dashboard cards")
    public List<RecentAlertDto> recentAlerts(
            @RequestParam(defaultValue = "10") int limit
    ) {
        int size = Math.max(1, Math.min(limit, 50));
        // Use crisis flags as the primary source of critical alerts
        return crisisFlagRepository.findTopNByOrderByCreatedAtDesc(size).stream()
                .map(AdminDashboardController::toAlert)
                .collect(Collectors.toList());
    }

    @GetMapping("/crisis-heatmap")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crisis heatmap", description = "Daily crisis-flag counts for calendar heatmaps (last 90 days)")
    public List<Map<String, Object>> crisisHeatmap() {
        OffsetDateTime to = nowUtc();
        OffsetDateTime from = to.minusDays(90);
        return crisisFlagRepository.aggregateCrisisFlagsByDay(from, to).stream()
                .map(row -> {
                    Object dayObj = row[0];
                    LocalDate day;
                    if (dayObj instanceof LocalDate d) {
                        day = d;
                    } else if (dayObj instanceof java.sql.Date d) {
                        day = d.toLocalDate();
                    } else {
                        day = LocalDate.parse(dayObj.toString());
                    }
                    Long count = ((Number) row[1]).longValue();
                    Map<String, Object> m = new HashMap<>();
                    m.put("day", day);
                    m.put("count", count);
                    return m;
                })
                .toList();
    }

    @GetMapping("/trending-topics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Trending topics", description = "Top crisis keywords used as trending wellness topics")
    public List<KeywordStat> trendingTopics(
            @RequestParam(defaultValue = "10") int limit
    ) {
        OffsetDateTime to = nowUtc();
        OffsetDateTime from = to.minusDays(30);
        int max = Math.max(1, Math.min(limit, 20));
        var pageRequest = org.springframework.data.domain.PageRequest.of(0, max);
        return crisisFlagRepository.findTopKeywords(from, to, pageRequest);
    }

    private static RecentAlertDto toAlert(CrisisFlag flag) {
        String title = "Crisis alert";
        String message = "Crisis keyword detected: " + flag.getKeywordDetected();
        return new RecentAlertDto(
                flag.getId(),
                title,
                message,
                flag.getCreatedAt(),
                flag.getUserId()
        );
    }
}
