// backend/src/main/java/com/mindease/auth/model/User.java
package com.mindease.auth.model;

import com.mindease.chat.model.enums.AIProvider;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER; // Default role

    @Column(name = "anonymous_mode", nullable = false)
    private Boolean anonymousMode = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Firebase UID for Firebase Auth integration
    @Column(name = "firebase_uid")
    private String firebaseUid;


    @Column(name = "deleted_at", columnDefinition = "timestamptz")
    private OffsetDateTime deletedAt;

    @Column(name = "banned", nullable = false)
    private boolean banned = false;

    @Column(name = "banned_at", columnDefinition = "timestamptz")
    private OffsetDateTime bannedAt;

    @Column(name = "banned_by")
    private UUID bannedBy;

    @Column(name = "preferred_language", length = 10)
    private String preferredLanguage = "en";

    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Column(name = "region", length = 25)
    private String region = "global";

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    // AI Provider preference
    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_ai_provider")
    private com.mindease.chat.model.enums.AIProvider preferredAIProvider;

    // User profile fields for ML risk model (optional)
    @Column(name = "age")
    private Integer age;

    @Column(name = "gender", length = 50)
    private String gender;

    @Column(name = "course", length = 100)
    private String course;

    @Column(name = "year", length = 20)
    private String year;

    @Column(name = "cgpa")
    private Double cgpa;

    @Column(name = "marital_status", length = 50)
    private String maritalStatus;

    // New behavioral data fields for enhanced AI risk prediction model
    @Column(name = "days_indoors", length = 50)
    private String daysIndoors;

    @Column(name = "changes_habits", length = 10)
    private String changesHabits;

    @Column(name = "work_interest", length = 10)
    private String workInterest;

    @Column(name = "social_weakness", length = 10)
    private String socialWeakness;

    // Constructors
    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public User(String email, String passwordHash, Role role, Boolean anonymousMode, String firebaseUid) {
        this();
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.anonymousMode = anonymousMode;
        this.firebaseUid = firebaseUid;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Boolean getAnonymousMode() {
        return anonymousMode;
    }

    public void setAnonymousMode(Boolean anonymousMode) {
        this.anonymousMode = anonymousMode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    void setCreatedAt(LocalDateTime createdAt) { // package-private if needed for testing
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getFirebaseUid() {
        return firebaseUid;
    }

    public void setFirebaseUid(String firebaseUid) {
        this.firebaseUid = firebaseUid;
    }


    public OffsetDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(OffsetDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }

    public OffsetDateTime getBannedAt() {
        return bannedAt;
    }

    public void setBannedAt(OffsetDateTime bannedAt) {
        this.bannedAt = bannedAt;
    }

    public UUID getBannedBy() {
        return bannedBy;
    }

    public void setBannedBy(UUID bannedBy) {
        this.bannedBy = bannedBy;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public com.mindease.chat.model.enums.AIProvider getPreferredAIProvider() {
        return preferredAIProvider;
    }

    public void setPreferredAIProvider(com.mindease.chat.model.enums.AIProvider preferredAIProvider) {
        this.preferredAIProvider = preferredAIProvider;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public Double getCgpa() {
        return cgpa;
    }

    public void setCgpa(Double cgpa) {
        this.cgpa = cgpa;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public String getDaysIndoors() {
        return daysIndoors;
    }

    public void setDaysIndoors(String daysIndoors) {
        this.daysIndoors = daysIndoors;
    }

    public String getChangesHabits() {
        return changesHabits;
    }

    public void setChangesHabits(String changesHabits) {
        this.changesHabits = changesHabits;
    }

    public String getWorkInterest() {
        return workInterest;
    }

    public void setWorkInterest(String workInterest) {
        this.workInterest = workInterest;
    }

    public String getSocialWeakness() {
        return socialWeakness;
    }

    public void setSocialWeakness(String socialWeakness) {
        this.socialWeakness = socialWeakness;
    }

    private void validateBanFieldConsistency() {
        if (banned && (bannedAt == null || bannedBy == null)) {
            throw new IllegalStateException("bannedAt and bannedBy must be set when user is banned");
        }
        if (!banned && (bannedAt != null || bannedBy != null)) {
            throw new IllegalStateException("bannedAt and bannedBy must be null when user is not banned");
        }
    }

    // Pre-persist callback
    @PrePersist
    private void validateBanFields() {
        validateBanFieldConsistency();
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
    }

    // Pre-update callback
    @PreUpdate
    private void preUpdate() {
        validateBanFieldConsistency();
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='[REDACTED]'" +
                ", role=" + role +
                ", anonymousMode=" + anonymousMode +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", firebaseUid='[REDACTED]'" +
                '}';
    }
}
