package com.mindease.dto;

public class SubscriptionCreateResponse {
  private final String sessionId;
  private final String publishableKey;

  public SubscriptionCreateResponse(String sessionId, String publishableKey) {
    this.sessionId = sessionId;
    this.publishableKey = publishableKey;
  }

  public String getSessionId() {
    return sessionId;
  }

  public String getPublishableKey() {
    return publishableKey;
  }
}

