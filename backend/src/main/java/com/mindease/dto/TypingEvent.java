package com.mindease.dto;

import java.util.UUID;

/**
 * DTO for typing indicator events sent via WebSocket
 */
public class TypingEvent {

    private UUID userId;
    private boolean isTyping;
    private String timestamp;

    public TypingEvent() {
    }

    public TypingEvent(UUID userId, boolean isTyping) {
        this.userId = userId;
        this.isTyping = isTyping;
        this.timestamp = java.time.Instant.now().toString();
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public boolean isTyping() {
        return isTyping;
    }

    public void setTyping(boolean typing) {
        isTyping = typing;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
