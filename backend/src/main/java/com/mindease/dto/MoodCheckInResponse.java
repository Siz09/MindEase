package com.mindease.dto;

import com.mindease.model.MoodCheckIn;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class MoodCheckInResponse {
    private UUID id;
    private Integer score;
    private List<String> tags;
    private String checkinType;
    private UUID sessionId;
    private LocalDateTime createdAt;

    public MoodCheckInResponse() {
    }

    public MoodCheckInResponse(MoodCheckIn checkIn) {
        this.id = checkIn.getId();
        this.score = checkIn.getScore();
        this.tags = checkIn.getTags();
        this.checkinType = checkIn.getCheckinType();
        this.sessionId = checkIn.getSession() != null ? checkIn.getSession().getId() : null;
        this.createdAt = checkIn.getCreatedAt();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

