package com.mindease.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class JournalRequest {
    // Title is optional - null is allowed, but if provided, must not exceed 200 characters
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;
    private String content;

    // Optional mood value (1-10 scale) to link journal entry to a mood entry
    @Min(value = 1, message = "Mood value must be between 1 and 10")
    @Max(value = 10, message = "Mood value must be between 1 and 10")
    private Integer moodValue;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getMoodValue() {
        return moodValue;
    }

    public void setMoodValue(Integer moodValue) {
        this.moodValue = moodValue;
    }
}
