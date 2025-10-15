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

  @Column(name = "feature_name", unique = true)
  private String featureName;

  @Column(name = "enabled_for_premium")
  private Boolean enabledForPremium;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public FeatureFlag() {
    this.createdAt = LocalDateTime.now();
  }

  public FeatureFlag(String featureName, Boolean enabledForPremium) {
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

  public Boolean getEnabledForPremium() {
    return enabledForPremium;
  }

  public void setEnabledForPremium(Boolean enabledForPremium) {
    this.enabledForPremium = enabledForPremium;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}

