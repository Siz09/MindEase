package com.mindease.journal.dto;

public class JournalRequest {

    private String title;
    private String content;
    private Integer moodValue;

    public JournalRequest() {
    }

    public JournalRequest(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public JournalRequest(String title, String content, Integer moodValue) {
        this.title = title;
        this.content = content;
        this.moodValue = moodValue;
    }

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
