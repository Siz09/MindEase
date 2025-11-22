package com.mindease.dto;

import jakarta.validation.constraints.NotNull;

public class GuidedResponseRequest {

    @NotNull(message = "Response is required")
    private String response;

    public GuidedResponseRequest() {
    }

    public GuidedResponseRequest(String response) {
        this.response = response;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }
}
