package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_activity", indexes = {
  @Index(name = "idx_useractivity_user", columnList = "user_id"),
  @Index(name = "idx_useractivity_last_active", columnList = "last_active_at")
})
public class UserActivity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "last_active_at", nullable = false)
  private LocalDateTime lastActiveAt;

  // Constructors
  public UserActivity() {}

  public UserActivity(User user, LocalDateTime lastActiveAt) {
    this.user = user;
    this.lastActiveAt = lastActiveAt;
  }

  // Getters & setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public LocalDateTime getLastActiveAt() { return lastActiveAt; }
  public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

  @Override
  public String toString() {
    return "UserActivity{" +
      "id=" + id +
      ", user=" + (user != null ? user.getEmail() : "null") +
      ", lastActiveAt=" + lastActiveAt +
      '}';
  }
}
