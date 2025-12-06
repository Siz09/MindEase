package com.mindease.shared.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting interceptor for WebSocket messages to prevent abuse.
 * Limits the number of messages a user can send per minute.
 */
@Component
public class WebSocketRateLimitingInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketRateLimitingInterceptor.class);

    // Rate limit: 10 messages per minute per user
    private static final int MAX_MESSAGES_PER_MINUTE = 10;
    // Burst allowance: allow 3 extra messages in quick succession
    private static final int BURST_SIZE = 3;
    private static final long WINDOW_MILLIS = 60 * 1000L; // 1 minute

    private static class RateLimitCounter {
        private final AtomicInteger messageCount = new AtomicInteger(0);
        private volatile long windowStart = Instant.now().toEpochMilli();

        int incrementAndGet() {
            return messageCount.incrementAndGet();
        }

        void resetWindow() {
            messageCount.set(0);
            windowStart = Instant.now().toEpochMilli();
        }

        int getCount() {
            return messageCount.get();
        }

        long getWindowStart() {
            return windowStart;
        }
    }

    private final Map<String, RateLimitCounter> userCounters = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        // Only rate limit SEND commands (actual messages)
        if (!StompCommand.SEND.equals(accessor.getCommand())) {
            return message;
        }

        // Get authenticated user
        Authentication auth = (Authentication) accessor.getUser();
        if (auth == null || auth.getName() == null) {
            logger.warn("WebSocket SEND rejected: User not authenticated");
            throw new IllegalArgumentException("User not authenticated");
        }

        String username = auth.getName();
        long now = Instant.now().toEpochMilli();

        // Get or create counter for this user
        RateLimitCounter counter = userCounters.computeIfAbsent(username, k -> new RateLimitCounter());

        synchronized (counter) {
            long elapsed = now - counter.getWindowStart();

            // Reset window if expired
            if (elapsed > WINDOW_MILLIS) {
                counter.resetWindow();
                elapsed = 0; // Update elapsed after reset
            }

            int currentCount = counter.incrementAndGet();
            int limit = MAX_MESSAGES_PER_MINUTE + BURST_SIZE;

            if (currentCount > limit) {
                logger.warn("WebSocket rate limit exceeded for user: {} ({} messages in {} ms)",
                        username, currentCount, elapsed);
                throw new IllegalArgumentException(
                        String.format(
                                "Rate limit exceeded. Maximum %d messages per minute allowed (including %d burst messages).",
                                MAX_MESSAGES_PER_MINUTE + BURST_SIZE, BURST_SIZE));
            }

            // Log warning when approaching limit
            if (currentCount == MAX_MESSAGES_PER_MINUTE) {
                logger.info("User {} approaching rate limit ({}/{})", username, currentCount, limit);
            }
        }

        return message;
    }

    /**
     * Cleanup old counters periodically to prevent memory leaks.
     * This should be called by a scheduled task.
     */
    public void cleanup() {
        long now = Instant.now().toEpochMilli();
        userCounters.entrySet().removeIf(entry -> {
            RateLimitCounter counter = entry.getValue();
            return (now - counter.getWindowStart()) > (WINDOW_MILLIS * 2);
        });
        logger.debug("WebSocket rate limit cleanup: {} active users", userCounters.size());
    }

    /**
     * Get current message count for a user (for testing/monitoring).
     */
    public int getMessageCount(String username) {
        RateLimitCounter counter = userCounters.get(username);
        return counter != null ? counter.getCount() : 0;
    }
}
