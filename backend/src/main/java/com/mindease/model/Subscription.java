package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription")
public class Subscription {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "stripe_subscription_id")
  private String stripeSubscriptionId;

  @Column(name = "plan_type")
  private String planType;

  @Column(name = "status")
  private String status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  public Subscription() {
    this.createdAt = LocalDateTime.now();
  }

  public Subscription(User user, String stripeSubscriptionId, String planType, String status) {
    this();
    this.user = user;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.planType = planType;
    this.status = status;
  }

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

  public String getStripeSubscriptionId() {
    return stripeSubscriptionId;
  }

  public void setStripeSubscriptionId(String stripeSubscriptionId) {
    this.stripeSubscriptionId = stripeSubscriptionId;
  }

  public String getPlanType() {
    return planType;
  }

  public void setPlanType(String planType) {
    this.planType = planType;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}

