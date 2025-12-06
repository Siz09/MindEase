package com.mindease.subscription.dto;

import jakarta.validation.constraints.Pattern;

public class SubscriptionCreateRequest {

    private String planType;

    @Pattern(regexp = "(?i)monthly|month|mo|annual|yearly|year|yr", message = "Invalid billing period")
    private String billingPeriod;

    public SubscriptionCreateRequest() {
    }

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

