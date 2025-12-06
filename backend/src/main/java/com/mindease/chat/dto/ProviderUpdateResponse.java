package com.mindease.chat.dto;

public class ProviderUpdateResponse {
    private String status;
    private String provider;

    public ProviderUpdateResponse() {
    }

    public ProviderUpdateResponse(String status, String provider) {
        this.status = status;
        this.provider = provider;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}

