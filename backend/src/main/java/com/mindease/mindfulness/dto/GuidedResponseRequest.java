package com.mindease.mindfulness.dto;

public class GuidedResponseRequest {
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

