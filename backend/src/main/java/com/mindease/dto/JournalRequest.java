package com.mindease.dto;

import jakarta.validation.constraints.Size;

public class JournalRequest {
    // Title is optional - null is allowed, but if provided, must not exceed 200 characters
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;
    private String content;

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
}
