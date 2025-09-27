package com.mindease.dto;

import java.time.LocalDateTime;

public class ChatResponse {
  private String content;
  private boolean isCrisisFlagged;
  private LocalDateTime timestamp;
  private String provider;

  public ChatResponse() {
    this.timestamp = LocalDateTime.now();
  }

  public ChatResponse(String content, boolean isCrisisFlagged, String provider) {
    this();
    this.content = content;
    this.isCrisisFlagged = isCrisisFlagged;
    this.provider = provider;
  }

  // Getters and setters
  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public boolean isCrisisFlagged() {
    return isCrisisFlagged;
  }

  public void setCrisisFlagged(boolean crisisFlagged) {
    isCrisisFlagged = crisisFlagged;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(LocalDateTime timestamp) {
    this.timestamp = timestamp;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }
}