package com.mindease.shared.config;

import com.mindease.shared.filter.WebSocketRateLimitingInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Scheduled tasks for WebSocket maintenance and cleanup.
 */
@Configuration
public class WebSocketCleanupScheduler {

    @Autowired
    private WebSocketRateLimitingInterceptor rateLimitingInterceptor;

    /**
     * Cleanup expired rate limit counters every 5 minutes.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000L) // 5 minutes
    public void cleanupRateLimitCounters() {
        rateLimitingInterceptor.cleanup();
    }
}
