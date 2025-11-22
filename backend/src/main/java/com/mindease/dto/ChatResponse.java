package com.mindease.dto;

import com.mindease.model.CrisisResource;
import com.mindease.model.ModerationAction;
import com.mindease.model.RiskLevel;

import java.time.LocalDateTime;
import java.util.List;

public class ChatResponse {
  private String content;
  private boolean isCrisisFlagged;
  private LocalDateTime timestamp;
  private String provider;
  private RiskLevel riskLevel;
  private List<CrisisResource> crisisResources;
  private ModerationAction moderationAction;
  private String moderationWarning;

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

  public RiskLevel getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(RiskLevel riskLevel) {
    this.riskLevel = riskLevel;
  }

  public List<CrisisResource> getCrisisResources() {
    return crisisResources;
  }

  public void setCrisisResources(List<CrisisResource> crisisResources) {
    this.crisisResources = crisisResources;
  }

  public ModerationAction getModerationAction() {
    return moderationAction;
  }

  public void setModerationAction(ModerationAction moderationAction) {
    this.moderationAction = moderationAction;
  }

  public String getModerationWarning() {
    return moderationWarning;
  }

  public void setModerationWarning(String moderationWarning) {
    this.moderationWarning = moderationWarning;
  }
}