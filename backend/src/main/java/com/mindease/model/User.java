// backend/src/main/java/com/mindease/model/User.java
package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(name = "password_hash")
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role = Role.USER; // Default role

  @Column(name = "anonymous_mode", nullable = false)
  private Boolean anonymousMode = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Firebase UID for Firebase Auth integration
  @Column(name = "firebase_uid")
  private String firebaseUid;

  @Column(name = "quiet_hours_start")
  private LocalTime quietHoursStart;

  @Column(name = "quiet_hours_end")
  private LocalTime quietHoursEnd;

  @Column(name = "deleted_at", columnDefinition = "timestamptz")
  private OffsetDateTime deletedAt;

  @Column(name = "banned", nullable = false)
  private boolean banned = false;

  @Column(name = "banned_at", columnDefinition = "timestamptz")
  private OffsetDateTime bannedAt;

  @Column(name = "banned_by")
  private UUID bannedBy;

  // Constructors
  public User() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public User(String email, String passwordHash, Role role, Boolean anonymousMode, String firebaseUid) {
    this();
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.anonymousMode = anonymousMode;
    this.firebaseUid = firebaseUid;
  }

  // Getters and Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public Boolean getAnonymousMode() {
    return anonymousMode;
  }

  public void setAnonymousMode(Boolean anonymousMode) {
    this.anonymousMode = anonymousMode;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getFirebaseUid() {
    return firebaseUid;
  }

  public void setFirebaseUid(String firebaseUid) {
    this.firebaseUid = firebaseUid;
  }

  public LocalTime getQuietHoursStart() {
    return quietHoursStart;
  }

  public void setQuietHoursStart(LocalTime quietHoursStart) {
    this.quietHoursStart = quietHoursStart;
  }

  public LocalTime getQuietHoursEnd() {
    return quietHoursEnd;
  }

  public void setQuietHoursEnd(LocalTime quietHoursEnd) {
    this.quietHoursEnd = quietHoursEnd;
  }

  public OffsetDateTime getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(OffsetDateTime deletedAt) {
    this.deletedAt = deletedAt;
  }

  public boolean isBanned() {
    return banned;
  }

  public void setBanned(boolean banned) {
    this.banned = banned;
  }

  public OffsetDateTime getBannedAt() {
    return bannedAt;
  }

  public void setBannedAt(OffsetDateTime bannedAt) {
    this.bannedAt = bannedAt;
  }

  public UUID getBannedBy() {
    return bannedBy;
  }

  public void setBannedBy(UUID bannedBy) {
    this.bannedBy = bannedBy;
  }

  // Pre-update callback
  @PreUpdate
  public void preUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  @Override
  public String toString() {
    return "User{" +
      "id=" + id +
      ", email='" + email + '\'' +
      ", role=" + role +
      ", anonymousMode=" + anonymousMode +
      ", createdAt=" + createdAt +
      ", updatedAt=" + updatedAt +
      ", firebaseUid='" + firebaseUid + '\'' +
      '}';
  }
}
