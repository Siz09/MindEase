package com.mindease.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authentication response")
public class AuthResponse {

    @Schema(description = "Response status", example = "success")
    private String status;

    @Schema(description = "Response message", example = "Login successful")
    private String message;

    @Schema(description = "JWT access token")
    private String token;

    @Schema(description = "Refresh token for obtaining new access tokens")
    private String refreshToken;

    @Schema(description = "User information")
    private UserDTO user;

    public AuthResponse() {
    }

    public AuthResponse(String status, String message, String token, UserDTO user) {
        this.status = status;
        this.message = message;
        this.token = token;
        this.user = user;
    }

    public AuthResponse(String status, String message, String token, String refreshToken, UserDTO user) {
        this.status = status;
        this.message = message;
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public static AuthResponse success(String message, String token, UserDTO user) {
        return new AuthResponse("success", message, token, user);
    }

    public static AuthResponse success(String message, String token, String refreshToken, UserDTO user) {
        return new AuthResponse("success", message, token, refreshToken, user);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}

