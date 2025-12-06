package com.mindease.chat.dto;

import com.mindease.chat.model.enums.AIProvider;

public class CurrentProviderResponse {
    private String currentProvider;
    private AIProvider[] availableProviders;

    public CurrentProviderResponse() {
    }

    public CurrentProviderResponse(String currentProvider, AIProvider[] availableProviders) {
        this.currentProvider = currentProvider;
        this.availableProviders = availableProviders;
    }

    public String getCurrentProvider() {
        return currentProvider;
    }

    public void setCurrentProvider(String currentProvider) {
        this.currentProvider = currentProvider;
    }

    public AIProvider[] getAvailableProviders() {
        return availableProviders;
    }

    public void setAvailableProviders(AIProvider[] availableProviders) {
        this.availableProviders = availableProviders;
    }
}
