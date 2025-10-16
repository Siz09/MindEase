package com.mindease.dto;

import jakarta.validation.constraints.NotBlank;

public class SubscriptionCreateRequest {
  @NotBlank
  private String planType;

  public SubscriptionCreateRequest() {}

  public SubscriptionCreateRequest(String planType) {
    this.planType = planType;
  }

  public String getPlanType() {
    return planType;
  }

  public void setPlanType(String planType) {
    this.planType = planType;
  }
}

