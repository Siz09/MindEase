package com.mindease.controller;

import com.mindease.dto.ErrorSummary;
import com.mindease.dto.SystemHealthResponse;
import com.mindease.dto.SystemStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/admin/system")
@Tag(name = "Admin System")
public class AdminSystemController {

    private static final Logger log = LoggerFactory.getLogger(AdminSystemController.class);

    private final DataSource dataSource;
    private final com.mindease.service.PerformanceMonitorService performanceMonitorService;

    public AdminSystemController(DataSource dataSource,
            com.mindease.service.PerformanceMonitorService performanceMonitorService) {
        this.dataSource = dataSource;
        this.performanceMonitorService = performanceMonitorService;
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "System status", description = "High-level status of API, database, and AI engine")
    public SystemStatusResponse status() {
        String dbStatus = "unhealthy";
        try (Connection connection = dataSource.getConnection()) {
            dbStatus = connection.isValid(1) ? "healthy" : "degraded";
        } catch (Exception e) {
            log.error("Database health check failed", e);
            dbStatus = "unhealthy";
        }
        // API is up if this endpoint is reachable; AI engine is assumed running if
        // configured
        return new SystemStatusResponse("operational", dbStatus, "running");
    }

    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Server resources", description = "Approximate CPU, memory, and disk usage for the UI")
    public SystemHealthResponse health() {
        java.util.Map<String, Object> metrics = performanceMonitorService.getSystemMetrics();

        int memoryUsage = 0;
        if (metrics.containsKey("heapMemoryUsagePercent")) {
            memoryUsage = ((Double) metrics.get("heapMemoryUsagePercent")).intValue();
        }

        int cpu = 0;
        if (metrics.containsKey("systemCpuLoad")) {
            cpu = ((Double) metrics.get("systemCpuLoad")).intValue();
        }

        // Disk usage - using File roots
        int disk = 0;
        try {
            java.io.File root = new java.io.File("/");
            long totalSpace = root.getTotalSpace();
            long freeSpace = root.getFreeSpace();
            if (totalSpace > 0) {
                disk = (int) (((totalSpace - freeSpace) * 100) / totalSpace);
            }
        } catch (Exception e) {
            // Ignore disk error
        }

        long uptime = 0;
        if (metrics.containsKey("uptime")) {
            uptime = (Long) metrics.get("uptime");
        }

        int activeThreads = 0;
        if (metrics.containsKey("activeThreads")) {
            activeThreads = (Integer) metrics.get("activeThreads");
        }

        return new SystemHealthResponse(cpu, clampPercent(memoryUsage), clampPercent(disk), uptime, activeThreads);
    }

    private static int clampPercent(int value) {
        if (value < 0)
            return 0;
        if (value > 100)
            return 100;
        return value;
    }

    @GetMapping("/errors")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Recent errors", description = "Summary of recent errors (stub; currently empty list)")
    public ResponseEntity<List<ErrorSummary>> errors() {
        // No structured error store yet; return an empty list so the UI shows 'No
        // errors detected'.
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/api-usage")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "API usage", description = "Placeholder endpoint for API usage metrics")
    public java.util.Map<String, Object> apiUsage() {
        // Stub response; real implementation would aggregate request metrics.
        return java.util.Map.of(
                "requestsPerMinute", 0,
                "peakRequestsPerMinute", 0,
                "totalRequestsToday", 0);
    }
}
