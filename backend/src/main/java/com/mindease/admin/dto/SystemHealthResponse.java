package com.mindease.admin.dto;

public record SystemHealthResponse(
        int cpu,
        int memory,
        int disk,
        long uptime,
        int activeThreads,
        int connectedUsers) {
}

