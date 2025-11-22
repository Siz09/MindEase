package com.mindease.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a mood check-in by a user.
 * Can be standalone, pre-chat, or post-chat.
 */
@Entity
@Table(name = "mood_checkins")
public class MoodCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private ChatSession session;

    @Column(name = "score", nullable = false)
    @Min(1)
    @Max(5)
    private Integer score; // 1-5 scale

    @Column(name = "tags", columnDefinition = "TEXT[]")
    private List<String> tags; // ['anxious', 'calm', 'stressed', etc.]

    @Column(name = "checkin_type", nullable = false)
    private String checkinType; // 'pre_chat', 'post_chat', 'standalone'

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public MoodCheckIn() {
        this.createdAt = LocalDateTime.now();
    }

    public MoodCheckIn(User user, Integer score, List<String> tags, String checkinType) {
        this();
        this.user = user;
        this.score = score;
        this.tags = tags;
        this.checkinType = checkinType;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ChatSession getSession() {
        return session;
    }

    public void setSession(ChatSession session) {
        this.session = session;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public String getCheckinType() {
        return checkinType;
    }

    public void setCheckinType(String checkinType) {
        this.checkinType = checkinType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    protected void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "MoodCheckIn{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : null) +
                ", score=" + score +
                ", checkinType='" + checkinType + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

