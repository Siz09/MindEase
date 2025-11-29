package com.mindease.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a unified mood record from either MoodEntry or MoodCheckIn.
 */
public class UnifiedMoodRecord {
    private UUID id;
    private Integer moodValue; // Normalized to 1-10 scale
    private String source; // "mood_entry" or "mood_checkin"
    private String notes;
    private String checkinType; // Only for mood_checkin source
    private LocalDateTime createdAt;

    public UnifiedMoodRecord() {
    }

    public UnifiedMoodRecord(UUID id, Integer moodValue, String source, String notes,
                            String checkinType, LocalDateTime createdAt) {
        this.id = id;
        this.moodValue = moodValue;
        this.source = source;
        this.notes = notes;
        this.checkinType = checkinType;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Integer getMoodValue() {
        return moodValue;
    }

    public void setMoodValue(Integer moodValue) {
        this.moodValue = moodValue;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCheckinType() {
        return checkinType;
    }

    public void setCheckinType(String checkinType) {
        this.checkinType = checkinType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
