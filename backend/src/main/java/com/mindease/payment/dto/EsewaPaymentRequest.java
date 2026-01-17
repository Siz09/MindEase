package com.mindease.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

/**
 * DTO for creating eSewa payment request.
 */
public class EsewaPaymentRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Tax amount is required")
    @DecimalMin(value = "0.0", message = "Tax amount cannot be negative")
    private BigDecimal taxAmount;

    @DecimalMin(value = "0.0", message = "Product service charge cannot be negative")
    private BigDecimal productServiceCharge = BigDecimal.ZERO;

    @DecimalMin(value = "0.0", message = "Product delivery charge cannot be negative")
    private BigDecimal productDeliveryCharge = BigDecimal.ZERO;

    @NotBlank(message = "Billing period is required")
    @Pattern(regexp = "(?i)(monthly|annual|yearly)", message = "Billing period must be monthly, annual, or yearly")
    private String billingPeriod;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getProductServiceCharge() {
        return productServiceCharge;
    }

    public void setProductServiceCharge(BigDecimal productServiceCharge) {
        this.productServiceCharge = productServiceCharge;
    }

    public BigDecimal getProductDeliveryCharge() {
        return productDeliveryCharge;
    }

    public void setProductDeliveryCharge(BigDecimal productDeliveryCharge) {
        this.productDeliveryCharge = productDeliveryCharge;
    }

    public String getBillingPeriod() {
        return billingPeriod;
    }

    public void setBillingPeriod(String billingPeriod) {
        this.billingPeriod = billingPeriod;
    }
}