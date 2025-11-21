package com.mindease.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for authentication endpoints to provide
 * basic brute-force protection.
 *
 * NOTE: This is intended for a single-node deployment and development/staging
 * environments. For production, consider a distributed rate limiting solution
 * (e.g., Redis, API gateway) and ensure that proxy headers such as
 * X-Forwarded-For
 * are sanitized by a trusted load balancer.
 */
@Component
public class AuthRateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimitingFilter.class);

    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String REGISTER_PATH = "/api/auth/register";

    // Allow 5 requests per 15 minutes per IP for auth endpoints
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000L;
    private static final long CLEANUP_INTERVAL_MILLIS = 60 * 60 * 1000L; // 1 hour

    private static class Counter {
        private final AtomicInteger attempts = new AtomicInteger(0);
        private volatile long windowStart = Instant.now().toEpochMilli();

        int incrementAndGet() {
            return attempts.incrementAndGet();
        }

        void resetWindow() {
            attempts.set(0);
            windowStart = Instant.now().toEpochMilli();
        }
    }

    private final Map<String, Counter> ipCounters = new ConcurrentHashMap<>();

    /**
     * Periodically remove stale IP counters to prevent unbounded memory growth.
     * Entries that have been idle for more than 2x the rate-limit window are
     * removed.
     */
    @Scheduled(fixedDelay = CLEANUP_INTERVAL_MILLIS)
    void cleanupExpiredEntries() {
        long now = Instant.now().toEpochMilli();
        ipCounters.entrySet().removeIf(entry -> {
            Counter counter = entry.getValue();
            synchronized (counter) {
                return (now - counter.windowStart) > (WINDOW_MILLIS * 2);
            }
        });
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(LOGIN_PATH.equals(path) || REGISTER_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String ip = resolveClientIp(request);
        long now = Instant.now().toEpochMilli();

        Counter counter = ipCounters.computeIfAbsent(ip, k -> new Counter());

        synchronized (counter) {
            long elapsed = now - counter.windowStart;
            if (elapsed > WINDOW_MILLIS) {
                counter.resetWindow();
            }

            int attempts = counter.incrementAndGet();
            if (attempts > MAX_ATTEMPTS) {
                log.warn("Rate limit exceeded for IP {} on {}", ip, request.getRequestURI());
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"status\":\"error\",\"message\":\"Too many authentication attempts. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // Behind a trusted proxy, take the last IP (closest to the server).
            int commaIndex = forwarded.lastIndexOf(',');
            return commaIndex > 0 ? forwarded.substring(commaIndex + 1).trim() : forwarded.trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
