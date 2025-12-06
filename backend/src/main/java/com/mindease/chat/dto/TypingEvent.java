package com.mindease.chat.dto;

import java.util.UUID;

public class TypingEvent {

    private UUID userId;
    private boolean typing;

    public TypingEvent() {
    }

    public TypingEvent(UUID userId, boolean isTyping) {
        this.userId = userId;
        this.typing = isTyping;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public boolean isTyping() {
        return typing;
    }

    public void setTyping(boolean typing) {
        this.typing = typing;
    }
}

