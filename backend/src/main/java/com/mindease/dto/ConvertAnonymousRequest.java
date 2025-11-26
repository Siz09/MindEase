package com.mindease.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to convert anonymous account to full account")
public class ConvertAnonymousRequest {

    @Schema(description = "Email address for the full account", example = "user@example.com", required = true)
    private String email;

    @Schema(description = "Password for the full account", required = true)
    private String password;

    @Schema(description = "Firebase token after creating credentials", required = true)
    private String firebaseToken;

    // Constructors
    public ConvertAnonymousRequest() {
    }

    public ConvertAnonymousRequest(String email, String password, String firebaseToken) {
        this.email = email;
        this.password = password;
        this.firebaseToken = firebaseToken;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirebaseToken() {
        return firebaseToken;
    }

    public void setFirebaseToken(String firebaseToken) {
        this.firebaseToken = firebaseToken;
    }
}
