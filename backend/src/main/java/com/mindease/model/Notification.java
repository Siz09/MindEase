package com.mindease.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", indexes = {
  @Index(name = "idx_notification_user_created", columnList = "user_id, created_at"),
  @Index(name = "idx_notification_is_sent", columnList = "is_sent")
})
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "type", nullable = false, length = 20)
  private String type; // IN_APP or EMAIL

  @Column(name = "message", columnDefinition = "TEXT", nullable = false)
  private String message;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "is_sent", nullable = false)
  private Boolean isSent = false;

  // Constructors
  public Notification() {}

  public Notification(User user, String type, String message) {
    this.user = user;
    this.type = type;
    this.message = message;
  }

  // Getters & setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public Boolean getIsSent() { return isSent; }
  public void setIsSent(Boolean isSent) { this.isSent = isSent; }

  @Override
  public String toString() {
    return "Notification{" +
      "id=" + id +
      ", user=" + (user != null ? user.getEmail() : "null") +
      ", type='" + type + '\'' +
      ", isSent=" + isSent +
      ", createdAt=" + createdAt +
      '}';
  }
}
