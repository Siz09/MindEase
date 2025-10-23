package com.mindease.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "crisis_flags", indexes = {
    @Index(name = "idx_crisis_flags_user_time", columnList = "user_id, created_at"),
    @Index(name = "idx_crisis_flags_chat", columnList = "chat_id")
})
public class CrisisFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chat_id", nullable = false)
    private UUID chatId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "keyword_detected", nullable = false, length = 200)
    private String keywordDetected;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // getters/setters
    public UUID getId() { return id; }
    public UUID getChatId() { return chatId; }
    public void setChatId(UUID chatId) { this.chatId = chatId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getKeywordDetected() { return keywordDetected; }
    public void setKeywordDetected(String keywordDetected) { this.keywordDetected = keywordDetected; }
    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
