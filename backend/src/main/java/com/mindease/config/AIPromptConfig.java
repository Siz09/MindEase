package com.mindease.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration class for AI prompt settings.
 * Binds properties from application.yml for centralized prompt management.
 */
@Component
@ConfigurationProperties(prefix = "ai.prompts")
public class AIPromptConfig {

    private String journalSummary;
    private String moodInsight;
    private String journalSummarySystem;
    private String moodInsightSystem;

    public String getJournalSummary() {
        return journalSummary;
    }

    public void setJournalSummary(String journalSummary) {
        this.journalSummary = journalSummary;
    }

    public String getMoodInsight() {
        return moodInsight;
    }

    public void setMoodInsight(String moodInsight) {
        this.moodInsight = moodInsight;
    }

    public String getJournalSummarySystem() {
        return journalSummarySystem;
    }

    public void setJournalSummarySystem(String journalSummarySystem) {
        this.journalSummarySystem = journalSummarySystem;
    }

    public String getMoodInsightSystem() {
        return moodInsightSystem;
    }

    public void setMoodInsightSystem(String moodInsightSystem) {
        this.moodInsightSystem = moodInsightSystem;
    }
}
