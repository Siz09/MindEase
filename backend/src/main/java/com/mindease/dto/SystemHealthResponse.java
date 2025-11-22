package com.mindease.dto;

public record SystemHealthResponse(
        int cpu,
        int memory,
        int disk,
        long uptime,
        int activeThreads) {
}
