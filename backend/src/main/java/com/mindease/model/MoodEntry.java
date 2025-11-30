package com.mindease.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mood_entries")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MoodEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @JsonIgnore // avoid serializing the owning user to prevent lazy proxy issues
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "mood_value", nullable = false)
  private Integer moodValue; // 1-10 scale

  @Column(name = "notes", length = 1000)
  private String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  // Constructor
  public MoodEntry() {
    this.createdAt = LocalDateTime.now();
  }

  public MoodEntry(User user, Integer moodValue, String notes) {
    this();
    this.user = user;
    this.moodValue = moodValue;
    this.notes = notes;
  }

  // Getters and Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public Integer getMoodValue() {
    return moodValue;
  }

  public void setMoodValue(Integer moodValue) {
    this.moodValue = moodValue;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Override
  public String toString() {
    return "MoodEntry{" +
      "id=" + id +
      ", user=" + user.getEmail() +
      ", moodValue=" + moodValue +
      ", notes='" + notes + '\'' +
      ", createdAt=" + createdAt +
      '}';
  }
}
