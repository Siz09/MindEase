package com.mindease.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for tracking password reset requests for security monitoring and rate limiting.
 */
@Entity
@Table(name = "password_reset_requests", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_ip_address", columnList = "ip_address"),
    @Index(name = "idx_requested_at", columnList = "requested_at")
})
public class PasswordResetRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(nullable = false)
    private boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Constructors
    public PasswordResetRequest() {
        this.requestedAt = LocalDateTime.now();
    }

    public PasswordResetRequest(String email, String ipAddress, String userAgent) {
        this.email = email;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.requestedAt = LocalDateTime.now();
        this.completed = false;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
