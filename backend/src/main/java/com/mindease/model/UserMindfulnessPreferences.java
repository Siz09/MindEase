package com.mindease.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_mindfulness_preferences", uniqueConstraints = {
        @UniqueConstraint(columnNames = "user_id")
})
public class UserMindfulnessPreferences {
    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ElementCollection
    @CollectionTable(name = "user_favorite_sessions", joinColumns = @JoinColumn(name = "preferences_id"))
    @Column(name = "session_id")
    private List<UUID> favoriteSessionIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_preferred_categories", joinColumns = @JoinColumn(name = "preferences_id"))
    @Column(name = "category")
    private List<String> preferredCategories = new ArrayList<>();

    @Column(name = "preferred_difficulty")
    private String preferredDifficulty;

    @Column(name = "daily_goal_minutes")
    private Integer dailyGoalMinutes;

    @Column(name = "weekly_goal_minutes")
    private Integer weeklyGoalMinutes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public UserMindfulnessPreferences() {}

    public UserMindfulnessPreferences(User user) {
        this.user = user;
    }

    // Getters and setters
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

    public List<UUID> getFavoriteSessionIds() {
        return favoriteSessionIds;
    }

    public void setFavoriteSessionIds(List<UUID> favoriteSessionIds) {
        this.favoriteSessionIds = favoriteSessionIds;
    }

    public List<String> getPreferredCategories() {
        return preferredCategories;
    }

    public void setPreferredCategories(List<String> preferredCategories) {
        this.preferredCategories = preferredCategories;
    }

    public String getPreferredDifficulty() {
        return preferredDifficulty;
    }

    public void setPreferredDifficulty(String preferredDifficulty) {
        this.preferredDifficulty = preferredDifficulty;
    }

    public Integer getDailyGoalMinutes() {
        return dailyGoalMinutes;
    }

    public void setDailyGoalMinutes(Integer dailyGoalMinutes) {
        this.dailyGoalMinutes = dailyGoalMinutes;
    }

    public Integer getWeeklyGoalMinutes() {
        return weeklyGoalMinutes;
    }

    public void setWeeklyGoalMinutes(Integer weeklyGoalMinutes) {
        this.weeklyGoalMinutes = weeklyGoalMinutes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
