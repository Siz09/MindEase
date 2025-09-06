package com.mindease.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow frontend to connect during development
public class AuthController {

  /**
   * Register a new user
   * POST /api/auth/register
   */
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    // Stubbed response for now - will implement actual registration in Day 4
    Map<String, Object> response = new HashMap<>();
    response.put("message", "Registration endpoint - will be implemented with Firebase integration");
    response.put("status", "success");
    response.put("userId", UUID.randomUUID().toString());

    return ResponseEntity.ok(response);
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // Stubbed response for now - will implement actual login in Day 4
    Map<String, Object> response = new HashMap<>();
    response.put("message", "Login endpoint - will be implemented with JWT generation");
    response.put("status", "success");
    response.put("token", "stubbed-jwt-token-" + UUID.randomUUID().toString());

    return ResponseEntity.ok(response);
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser() {
    // Stubbed response for now - will implement actual user retrieval in Day 4
    Map<String, Object> response = new HashMap<>();
    response.put("message", "Current user endpoint - will be implemented with JWT validation");
    response.put("status", "success");

    Map<String, Object> user = new HashMap<>();
    user.put("id", UUID.randomUUID().toString());
    user.put("email", "user@example.com");
    user.put("role", "USER");
    user.put("anonymousMode", false);

    response.put("user", user);

    return ResponseEntity.ok(response);
  }

  // Request DTO classes
  public static class RegisterRequest {
    private String email;
    private String password;
    private Boolean anonymousMode;

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Boolean getAnonymousMode() { return anonymousMode; }
    public void setAnonymousMode(Boolean anonymousMode) { this.anonymousMode = anonymousMode; }
  }

  public static class LoginRequest {
    private String email;
    private String password;

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
  }
}
