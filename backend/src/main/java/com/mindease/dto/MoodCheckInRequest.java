package com.mindease.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.UUID;

public class MoodCheckInRequest {

    @NotNull(message = "Score is required")
    @Min(value = 1, message = "Score must be between 1 and 5")
    @Max(value = 5, message = "Score must be between 1 and 5")
    private Integer score;

    private List<String> tags;

    @NotNull(message = "Check-in type is required")
    @Pattern(
        regexp = "^(pre_chat|post_chat|standalone)$",
        message = "Check-in type must be one of: pre_chat, post_chat, standalone"
    )
    private String checkinType; // "pre_chat", "post_chat", "standalone"

    private UUID sessionId; // Optional: link to chat session

    // Constructors
    public MoodCheckInRequest() {
    }

    public MoodCheckInRequest(Integer score, List<String> tags, String checkinType, UUID sessionId) {
        this.score = score;
        this.tags = tags;
        this.checkinType = checkinType;
        this.sessionId = sessionId;
    }

    // Getters and Setters
    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCheckinType() {
        return checkinType;
    }

    public void setCheckinType(String checkinType) {
        this.checkinType = checkinType;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }
}

