package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feature_flag")
public class FeatureFlag {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "feature_name", unique = true, nullable = false)
  private String featureName;

  @Column(name = "enabled_for_premium", nullable = false)
  private boolean enabledForPremium = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  public FeatureFlag() {
    // JPA lifecycle callbacks will handle timestamp initialization
  }

  public FeatureFlag(String featureName, boolean enabledForPremium) {
    this();
    this.featureName = featureName;
    this.enabledForPremium = enabledForPremium;
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getFeatureName() {
    return featureName;
  }

  public void setFeatureName(String featureName) {
    this.featureName = featureName;
  }

  public boolean isEnabledForPremium() {
    return enabledForPremium;
  }

  public void setEnabledForPremium(boolean enabledForPremium) {
    this.enabledForPremium = enabledForPremium;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  protected void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  @PrePersist
  public void prePersist() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  public void preUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}
