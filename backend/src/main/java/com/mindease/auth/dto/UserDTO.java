package com.mindease.auth.dto;

import com.mindease.auth.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "User response DTO")
public class UserDTO {

    @Schema(description = "User ID", example = "d290f1ee-6c54-4b01-90e6-d701748f0851")
    private UUID id;

    @Schema(description = "User email address", example = "user@example.com")
    private String email;

    @Schema(description = "User role", example = "USER")
    private Role role;

    @Schema(description = "Whether user is in anonymous mode", example = "false")
    private Boolean anonymousMode;

    public UserDTO() {
    }

    public UserDTO(UUID id, String email, Role role, Boolean anonymousMode) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.anonymousMode = anonymousMode;
    }

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
}

