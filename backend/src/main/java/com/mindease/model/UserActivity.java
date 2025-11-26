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

  @Column(name = "failed_login_attempts", nullable = false)
  private int failedLoginAttempts = 0;

  @Column(name = "locked_until")
  private LocalDateTime lockedUntil;

  // Constructors
  public UserActivity() {
  }

  public UserActivity(User user, LocalDateTime lastActiveAt) {
    if (user == null) {
      throw new IllegalArgumentException("User cannot be null");
    }
    if (lastActiveAt == null) {
      throw new IllegalArgumentException("LastActiveAt cannot be null");
    }
    this.user = user;
    this.lastActiveAt = lastActiveAt;
  }

  // Getters & setters
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
    if (user == null) {
      throw new IllegalArgumentException("User cannot be null");
    }
    this.user = user;
  }

  public LocalDateTime getLastActiveAt() {
    return lastActiveAt;
  }

  public void setLastActiveAt(LocalDateTime lastActiveAt) {
    if (lastActiveAt == null) {
      throw new IllegalArgumentException("LastActiveAt cannot be null");
    }
    this.lastActiveAt = lastActiveAt;
  }

  public int getFailedLoginAttempts() {
    return failedLoginAttempts;
  }

  public void setFailedLoginAttempts(int failedLoginAttempts) {
    this.failedLoginAttempts = failedLoginAttempts;
  }

  public LocalDateTime getLockedUntil() {
    return lockedUntil;
  }

  public void setLockedUntil(LocalDateTime lockedUntil) {
    this.lockedUntil = lockedUntil;
  }

  /**
   * Check if account is currently locked
   */
  public boolean isLocked() {
    return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
  }

  /**
   * Increment failed login attempts
   */
  public void incrementFailedAttempts() {
    this.failedLoginAttempts++;
  }

  /**
   * Reset failed login attempts
   */
  public void resetFailedAttempts() {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  @Override
  public String toString() {
    return "UserActivity{" +
      "id=" + id +
      ", userId=" + (user != null ? user.getId() : "null") +
      ", lastActiveAt=" + lastActiveAt +
      ", failedLoginAttempts=" + failedLoginAttempts +
      ", lockedUntil=" + lockedUntil +
      '}';
  }
}
