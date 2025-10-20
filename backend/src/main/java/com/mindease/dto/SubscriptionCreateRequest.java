package com.mindease.dto;

// planType is optional in simplified two-price mode

public class SubscriptionCreateRequest {
  private String planType;
  // Optional; defaults are applied server-side when absent
  private String billingPeriod;

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

  public String getBillingPeriod() {
    return billingPeriod;
  }

  public void setBillingPeriod(String billingPeriod) {
    this.billingPeriod = billingPeriod;
  }
}
