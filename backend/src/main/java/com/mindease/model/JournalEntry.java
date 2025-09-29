package com.mindease.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "journal_entries", indexes = {
  @Index(name = "idx_journal_user_created", columnList = "user_id, created_at"),
  @Index(name = "idx_journal_created", columnList = "created_at")
})
public class JournalEntry {
  @Id
  @GeneratedValue
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String content;

  @Column(name = "ai_summary", columnDefinition = "TEXT")
  private String aiSummary;

  @Column(name = "mood_insight")
  private String moodInsight;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  // Constructors, getters, and setters
  public JournalEntry() {}

  public JournalEntry(UUID userId, String content) {
    this.userId = userId;
    this.content = content;
  }

  // Getters and setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public UUID getUserId() { return userId; }
  public void setUserId(UUID userId) { this.userId = userId; }

  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }

  public String getAiSummary() { return aiSummary; }
  public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

  public String getMoodInsight() { return moodInsight; }
  public void setMoodInsight(String moodInsight) { this.moodInsight = moodInsight; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
