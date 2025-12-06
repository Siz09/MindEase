package com.mindease.admin.model;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "admin_settings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_admin_settings_feature_name", columnNames = "feature_name")
})
public class AdminSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Legacy feature-flag style settings (used by CrisisFlaggingService)
    @Column(name = "feature_name", nullable = false, length = 120)
    private String featureName;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime createdAt;

    // Extended global settings (used by AdminManagementController)
    @Column(name = "crisis_threshold")
    private Integer crisisThreshold;

    @Column(name = "email_notifications")
    private String emailNotifications;

    @Column(name = "auto_archive")
    private boolean autoArchive;

    @Column(name = "auto_archive_days")
    private Integer autoArchiveDays;

    @Column(name = "daily_report_time")
    private LocalTime dailyReportTime;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getFeatureName() {
        return featureName;
    }

    public void setFeatureName(String featureName) {
        this.featureName = featureName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getCrisisThreshold() {
        return crisisThreshold;
    }

    public void setCrisisThreshold(Integer crisisThreshold) {
        this.crisisThreshold = crisisThreshold;
    }

    public String getEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(String emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public boolean isAutoArchive() {
        return autoArchive;
    }

    public void setAutoArchive(boolean autoArchive) {
        this.autoArchive = autoArchive;
    }

    public Integer getAutoArchiveDays() {
        return autoArchiveDays;
    }

    public void setAutoArchiveDays(Integer autoArchiveDays) {
        this.autoArchiveDays = autoArchiveDays;
    }

    public LocalTime getDailyReportTime() {
        return dailyReportTime;
    }

    public void setDailyReportTime(LocalTime dailyReportTime) {
        this.dailyReportTime = dailyReportTime;
    }
}

