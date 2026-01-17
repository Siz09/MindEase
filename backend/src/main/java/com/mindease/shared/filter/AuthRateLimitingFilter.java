package com.mindease.shared.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
    private static final String ME_PATH = "/api/auth/me";
    private static final String PASSWORD_RESET_PATH = "/api/auth/request-password-reset";

    // Configurable rate limits (with defaults for backward compatibility)
    @Value("${auth.rate-limit.login.max-attempts:20}")
    private int maxLoginAttempts;

    @Value("${auth.rate-limit.login.window-minutes:15}")
    private int loginWindowMinutes;

    @Value("${auth.rate-limit.register.max-attempts:10}")
    private int maxRegisterAttempts;

    @Value("${auth.rate-limit.register.window-minutes:15}")
    private int registerWindowMinutes;

    @Value("${auth.rate-limit.me.max-attempts:100}")
    private int maxMeAttempts;

    @Value("${auth.rate-limit.me.window-minutes:15}")
    private int meWindowMinutes;

    // Stricter rate limit for password reset (3 requests per hour) - kept as constant
    private static final int MAX_PASSWORD_RESET_ATTEMPTS = 3;
    private static final long PASSWORD_RESET_WINDOW_MILLIS = 60 * 60 * 1000L;
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
        // Use the longest window (login window) for cleanup threshold
        long maxWindowMillis = Math.max(
            loginWindowMinutes * 60 * 1000L,
            Math.max(registerWindowMinutes * 60 * 1000L, meWindowMinutes * 60 * 1000L)
        );
        ipCounters.entrySet().removeIf(entry -> {
            Counter counter = entry.getValue();
            synchronized (counter) {
                return (now - counter.windowStart) > (maxWindowMillis * 2);
            }
        });
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(LOGIN_PATH.equals(path) || REGISTER_PATH.equals(path) || ME_PATH.equals(path)
                || PASSWORD_RESET_PATH.equals(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String ip = resolveClientIp(request);
        String path = request.getRequestURI();
        long now = Instant.now().toEpochMilli();

        // Use different rate limits for different endpoints
        boolean isMeEndpoint = ME_PATH.equals(path);
        boolean isPasswordResetEndpoint = PASSWORD_RESET_PATH.equals(path);
        boolean isLoginEndpoint = LOGIN_PATH.equals(path);
        boolean isRegisterEndpoint = REGISTER_PATH.equals(path);

        int maxAttempts;
        long windowMillis;
        String counterKey;

        if (isMeEndpoint) {
            maxAttempts = maxMeAttempts;
            windowMillis = meWindowMinutes * 60 * 1000L;
            counterKey = ip + ":me";
        } else if (isPasswordResetEndpoint) {
            maxAttempts = MAX_PASSWORD_RESET_ATTEMPTS;
            windowMillis = PASSWORD_RESET_WINDOW_MILLIS;
            counterKey = ip + ":password-reset";
        } else if (isLoginEndpoint) {
            maxAttempts = maxLoginAttempts;
            windowMillis = loginWindowMinutes * 60 * 1000L;
            counterKey = ip + ":login";
        } else if (isRegisterEndpoint) {
            maxAttempts = maxRegisterAttempts;
            windowMillis = registerWindowMinutes * 60 * 1000L;
            counterKey = ip + ":register";
        } else {
            // Fallback to login limits for any other auth endpoints
            maxAttempts = maxLoginAttempts;
            windowMillis = loginWindowMinutes * 60 * 1000L;
            counterKey = ip;
        }
        Counter counter = ipCounters.computeIfAbsent(counterKey, k -> new Counter());

        synchronized (counter) {
            long elapsed = now - counter.windowStart;
            if (elapsed > windowMillis) {
                counter.resetWindow();
            }

            int attempts = counter.incrementAndGet();
            if (attempts > maxAttempts) {
                log.warn("Rate limit exceeded for IP {} on {}", ip, path);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"status\":\"error\",\"message\":\"Too many requests. Please try again later.\",\"code\":\"RATE_LIMIT_EXCEEDED\"}");
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
