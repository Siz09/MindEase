package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing localized crisis resources (hotlines, support services).
 * These are surfaced to users when high-risk situations are detected.
 */
@Entity
@Table(name = "crisis_resources")
public class CrisisResource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "language", nullable = false, length = 10)
    private String language; // e.g., "en", "ne"

    @Column(name = "region", length = 50)
    private String region; // e.g., "US", "NP", "global"

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // e.g., "hotline", "textline", "website", "emergency"

    @Column(name = "title", nullable = false)
    private String title; // e.g., "National Suicide Prevention Lifeline"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contact_info", nullable = false)
    private String contactInfo; // Phone number, URL, or text number

    @Column(name = "availability", length = 100)
    private String availability; // e.g., "24/7", "Mon-Fri 9am-5pm"

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0; // For ordering in UI

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public CrisisResource() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public CrisisResource(String language, String region, String resourceType, String title,
                         String description, String contactInfo, String availability, Integer displayOrder) {
        this();
        this.language = language;
        this.region = region;
        this.resourceType = resourceType;
        this.title = title;
        this.description = description;
        this.contactInfo = contactInfo;
        this.availability = availability;
        this.displayOrder = displayOrder;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    @Override
    public String toString() {
        return "CrisisResource{" +
                "id=" + id +
                ", language='" + language + '\'' +
                ", region='" + region + '\'' +
                ", resourceType='" + resourceType + '\'' +
                ", title='" + title + '\'' +
                ", contactInfo='" + contactInfo + '\'' +
                ", active=" + active +
                '}';
    }
}
