package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "chat_session_id", nullable = false)
  private ChatSession chatSession;

  @Column(name = "content", nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(name = "is_user_message", nullable = false)
  private Boolean isUserMessage;

  @Column(name = "is_crisis_flagged")
  private Boolean isCrisisFlagged = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  // Default constructor for JPA
  public Message() {
    this.createdAt = LocalDateTime.now();
  }

  // Constructor
  public Message(ChatSession chatSession, String content, Boolean isUserMessage) {
    this();
    this.chatSession = chatSession;
    this.content = content;
    this.isUserMessage = isUserMessage;
  }

  // Getters and Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public ChatSession getChatSession() {
    return chatSession;
  }

  public void setChatSession(ChatSession chatSession) {
    this.chatSession = chatSession;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public Boolean getIsUserMessage() {
    return isUserMessage;
  }

  public void setIsUserMessage(Boolean isUserMessage) {
    this.isUserMessage = isUserMessage;
  }

  public Boolean getIsCrisisFlagged() {
    return isCrisisFlagged;
  }

  public void setIsCrisisFlagged(Boolean isCrisisFlagged) {
    this.isCrisisFlagged = isCrisisFlagged;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Override
  public String toString() {
    return "Message{" +
      "id=" + id +
      ", chatSession=" + chatSession.getId() +
      ", content='" + content + '\'' +
      ", isUserMessage=" + isUserMessage +
      ", isCrisisFlagged=" + isCrisisFlagged +
      ", createdAt=" + createdAt +
      '}';
  }
}
