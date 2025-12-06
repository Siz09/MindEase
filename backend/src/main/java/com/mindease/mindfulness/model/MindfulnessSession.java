package com.mindease.mindfulness.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mindfulness_sessions")
public class MindfulnessSession {
  @Id
  @GeneratedValue
  private UUID id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String description;

  @Column(nullable = false)
  private String type;

  private Integer duration;

  @Column(name = "media_url")
  private String mediaUrl;

  @Column(name = "category")
  private String category;

  @Column(name = "difficulty_level")
  private String difficultyLevel;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  // Constructors
  public MindfulnessSession() {}

  public MindfulnessSession(String title, String description, String type, Integer duration,
                            String mediaUrl, String category, String difficultyLevel) {
    this.title = title;
    this.description = description;
    this.type = type;
    this.duration = duration;
    this.mediaUrl = mediaUrl;
    this.category = category;
    this.difficultyLevel = difficultyLevel;
  }

  // Getters and setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public Integer getDuration() { return duration; }
  public void setDuration(Integer duration) { this.duration = duration; }

  public String getMediaUrl() { return mediaUrl; }
  public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }

  public String getDifficultyLevel() { return difficultyLevel; }
  public void setDifficultyLevel(String difficultyLevel) { this.difficultyLevel = difficultyLevel; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
