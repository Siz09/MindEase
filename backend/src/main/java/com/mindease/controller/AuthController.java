// backend/src/main/java/com/mindease/controller/AuthController.java
package com.mindease.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.service.FirebaseService;
import com.mindease.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

  @Autowired
  private FirebaseService firebaseService;

  @Autowired
  private UserService userService;

  /**
   * Register a new user with Firebase token
   * POST /api/auth/register
   */
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
      // Verify Firebase token
      String firebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

      // Check if user already exists
      if (userService.findByFirebaseUid(firebaseUid).isPresent()) {
        return ResponseEntity.badRequest().body(createErrorResponse("User already exists"));
      }

      // Create new user
      User user = userService.createUser(
        request.getEmail(),
        Role.USER,
        request.getAnonymousMode(),
        firebaseUid
      );

      // Generate JWT token (stub for now, will implement in Day 5)
      String jwtToken = generateJwtToken(user);

      return ResponseEntity.ok(createAuthResponse(user, jwtToken, "Registration successful"));

    } catch (FirebaseAuthException e) {
      return ResponseEntity.status(401).body(createErrorResponse("Invalid Firebase token"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
    }
  }

  /**
   * Login user with Firebase token
   * POST /api/auth/login
   */
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
      // Verify Firebase token
      String firebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

      // Find user by Firebase UID
      User user = userService.findByFirebaseUid(firebaseUid)
        .orElseThrow(() -> new RuntimeException("User not found"));

      // Generate JWT token (stub for now, will implement in Day 5)
      String jwtToken = generateJwtToken(user);

      return ResponseEntity.ok(createAuthResponse(user, jwtToken, "Login successful"));

    } catch (FirebaseAuthException e) {
      return ResponseEntity.status(401).body(createErrorResponse("Invalid Firebase token"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
    try {
      // Extract JWT token from header (stub for now, will implement in Day 5)
      String jwtToken = authHeader.replace("Bearer ", "");

      // For now, return a stubbed response
      // In Day 5, we'll decode the JWT and get the actual user
      Map<String, Object> response = new HashMap<>();
      response.put("message", "Current user endpoint - JWT validation will be implemented in Day 5");
      response.put("status", "success");

      Map<String, Object> user = new HashMap<>();
      user.put("id", UUID.randomUUID().toString());
      user.put("email", "user@example.com");
      user.put("role", "USER");
      user.put("anonymousMode", false);

      response.put("user", user);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
    }
  }

  // Helper methods
  private String generateJwtToken(User user) {
    // Stub method - will implement proper JWT generation in Day 5
    return "jwt-token-stub-" + user.getId().toString();
  }

  private Map<String, Object> createAuthResponse(User user, String token, String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("message", message);
    response.put("status", "success");
    response.put("token", token);

    Map<String, Object> userInfo = new HashMap<>();
    userInfo.put("id", user.getId());
    userInfo.put("email", user.getEmail());
    userInfo.put("role", user.getRole());
    userInfo.put("anonymousMode", user.getAnonymousMode());

    response.put("user", userInfo);
    return response;
  }

  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("message", message);
    response.put("status", "error");
    return response;
  }

  // Request DTO classes
  public static class RegisterRequest {
    private String email;
    private String firebaseToken;
    private Boolean anonymousMode;

    // Getters and setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirebaseToken() { return firebaseToken; }
    public void setFirebaseToken(String firebaseToken) { this.firebaseToken = firebaseToken; }
    public Boolean getAnonymousMode() { return anonymousMode; }
    public void setAnonymousMode(Boolean anonymousMode) { this.anonymousMode = anonymousMode; }
  }

  public static class LoginRequest {
    private String firebaseToken;

    // Getters and setters
    public String getFirebaseToken() { return firebaseToken; }
    public void setFirebaseToken(String firebaseToken) { this.firebaseToken = firebaseToken; }
  }
}
