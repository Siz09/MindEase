package com.mindease.controller;

import org.springframework.security.core.Authentication;

import com.mindease.aop.annotations.AuditLogin;
import com.mindease.dto.AuthResponse;
import com.mindease.dto.ErrorResponse;
import com.mindease.dto.UserDTO;
import com.google.firebase.auth.FirebaseAuthException;
import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.service.FirebaseService;
import com.mindease.service.UserService;
import com.mindease.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and registration endpoints")
public class AuthController {

  @Autowired
  private FirebaseService firebaseService;

  @Autowired
  private UserService userService;

  @Autowired
  private JwtUtil jwtUtil;

  @Operation(summary = "Register a new user", description = "Register a new user with Firebase authentication")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Registration successful",
      content = @Content(schema = @Schema(implementation = AuthResponse.class))),
    @ApiResponse(responseCode = "400", description = "Invalid request or user already exists",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "401", description = "Invalid Firebase token",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    try {
      // Verify Firebase token
      String firebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

      // Check if user already exists
      if (userService.findByFirebaseUid(firebaseUid).isPresent()) {
        return ResponseEntity.badRequest().body(ErrorResponse.of("User already exists", "USER_ALREADY_EXISTS"));
      }

      // Create new user
      User user = userService.createUser(
        request.getEmail(),
        Role.USER,
        request.getAnonymousMode(),
        firebaseUid
      );

      // Track user activity on registration (async - fire-and-forget)
      userService.trackUserActivityAsync(user);

      // Generate JWT token
      String jwtToken = jwtUtil.generateToken(user);

      return ResponseEntity.ok(createAuthResponse(user, jwtToken, "Registration successful"));

    } catch (FirebaseAuthException e) {
      return ResponseEntity.status(401).body(ErrorResponse.of("Invalid Firebase token: " + e.getMessage(), "INVALID_FIREBASE_TOKEN"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage(), "REGISTRATION_FAILED"));
    }
  }

  @Operation(summary = "Login user", description = "Authenticate user with Firebase token")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Login successful",
      content = @Content(schema = @Schema(implementation = AuthResponse.class))),
    @ApiResponse(responseCode = "401", description = "Invalid Firebase token",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "404", description = "User not found",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  @PostMapping("/login")
  @AuditLogin
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
      // Verify Firebase token
      String firebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

      // Find user by Firebase UID
      User user = userService.findByFirebaseUid(firebaseUid)
        .orElseThrow(() -> new RuntimeException("User not found. Please register first."));

      // Track user activity on login (async - fire-and-forget)
      userService.trackUserActivityAsync(user);

      // Generate JWT token
      String jwtToken = jwtUtil.generateToken(user);

      return ResponseEntity.ok(createAuthResponse(user, jwtToken, "Login successful"));

    } catch (FirebaseAuthException e) {
      return ResponseEntity.status(401).body(ErrorResponse.of("Invalid Firebase token: " + e.getMessage(), "INVALID_FIREBASE_TOKEN"));
    } catch (Exception e) {
      String msg = e.getMessage() != null ? e.getMessage() : "Login failed";
      if (msg.toLowerCase().contains("user not found")) {
        return ResponseEntity.status(404).body(ErrorResponse.of(msg, "USER_NOT_FOUND"));
      }
      return ResponseEntity.badRequest().body(ErrorResponse.of(msg, "LOGIN_FAILED"));
    }
  }

  @Operation(summary = "Get current user", description = "Get current authenticated user information")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "User information retrieved",
      content = @Content(schema = @Schema(implementation = UserDTO.class))),
    @ApiResponse(responseCode = "404", description = "User not found",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser(Authentication authentication) {
    try {
      // Get the username (email) from the authentication object
      String email = authentication.getName();

      // Find the user by email
      User user = userService.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

      // Return user information without sensitive data
      UserDTO userDTO = new UserDTO(user.getId(), user.getEmail(), user.getRole(), user.getAnonymousMode());
      return ResponseEntity.ok(userDTO);

    } catch (Exception e) {
      return ResponseEntity.status(404).body(ErrorResponse.of("User not found: " + e.getMessage(), "USER_NOT_FOUND"));
    }
  }

  // Helper methods
  private AuthResponse createAuthResponse(User user, String token, String message) {
    UserDTO userDTO = new UserDTO(user.getId(), user.getEmail(), user.getRole(), user.getAnonymousMode());
    return AuthResponse.success(message, token, userDTO);
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
