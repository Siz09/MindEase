package com.mindease.payment.dto;

/**
 * Response DTO for eSewa payment creation.
 */
public class EsewaPaymentResponse {
    private String checkoutUrl;
    private String transactionUuid;
    private String formData; // JSON string of form data for client-side submission

    public EsewaPaymentResponse() {
    }

    public EsewaPaymentResponse(String checkoutUrl, String transactionUuid, String formData) {
        this.checkoutUrl = checkoutUrl;
        this.transactionUuid = transactionUuid;
        this.formData = formData;
    }

    public String getCheckoutUrl() {
        return checkoutUrl;
    }

    public void setCheckoutUrl(String checkoutUrl) {
        this.checkoutUrl = checkoutUrl;
    }

    public String getTransactionUuid() {
        return transactionUuid;
    }

    public void setTransactionUuid(String transactionUuid) {
        this.transactionUuid = transactionUuid;
    }

    public String getFormData() {
        return formData;
    }

    public void setFormData(String formData) {
        this.formData = formData;
    }
}