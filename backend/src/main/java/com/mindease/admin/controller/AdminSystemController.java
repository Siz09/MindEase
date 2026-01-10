package com.mindease.admin.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/admin/system")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AdminSystemController {

    private final DataSource dataSource;
    private final RestTemplate restTemplate;
    private final String pythonAiUrl;

    public AdminSystemController(
            DataSource dataSource,
            RestTemplate restTemplate,
            @Value("${python.ai.service.url:http://localhost:8000}") String pythonAiUrl) {
        this.dataSource = dataSource;
        this.restTemplate = restTemplate;
        this.pythonAiUrl = pythonAiUrl != null ? pythonAiUrl.replaceAll("/$", "") : "http://localhost:8000";
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> status() {
        return Map.of(
                "apiStatus", "operational",
                "database", isDatabaseHealthy() ? "healthy" : "down",
                "aiEngine", isPythonServiceHealthy(pythonAiUrl) ? "running" : "down");
    }

    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> health() {
        int memory = memoryPercent();
        int disk = diskPercent();
        // CPU and connected user tracking are not wired in this project yet.
        return Map.of(
                "cpu", -1,
                "memory", memory,
                "disk", disk,
                "connectedUsers", 0);
    }

    @GetMapping("/errors")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> errors() {
        return List.of();
    }

    @PostMapping("/notifications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> sendAnnouncement(@RequestBody Map<String, Object> body) {
        String message = body != null && body.get("message") instanceof String s ? s.trim() : null;
        if (message == null || message.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "error", "message", "Missing message"));
        }
        // Not yet broadcast to users; accept request so the admin UI works.
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private boolean isDatabaseHealthy() {
        try (Connection ignored = dataSource.getConnection()) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isPythonServiceHealthy(String baseUrl) {
        try {
            restTemplate.getForEntity(baseUrl + "/health", Map.class);
            return true;
        } catch (RestClientException e) {
            return false;
        }
    }

    private static int memoryPercent() {
        Runtime rt = Runtime.getRuntime();
        long max = rt.maxMemory();
        if (max <= 0)
            return -1;
        long used = rt.totalMemory() - rt.freeMemory();
        return (int) Math.round((used * 100.0) / max);
    }

    private static int diskPercent() {
        try {
            File root = new File(".");
            long total = root.getTotalSpace();
            long free = root.getUsableSpace();
            if (total <= 0)
                return -1;
            long used = total - free;
            return (int) Math.round((used * 100.0) / total);
        } catch (Exception e) {
            return -1;
        }
    }
}
