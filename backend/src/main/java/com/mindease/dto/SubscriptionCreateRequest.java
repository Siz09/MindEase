package com.mindease.dto;

import jakarta.validation.constraints.Pattern;

/**
 * DTO for subscription creation.
 *
 * planType is optional in simplified two-price mode.
 * billingPeriod is optional but, if present, must match allowed values.
 */
public class SubscriptionCreateRequest {

    // Optional; defaults are applied server-side when absent
    private String planType;

    // Optional; defaults are applied server-side when absent
    // Accept common variants case-insensitively; controller further normalizes
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
