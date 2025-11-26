package com.mindease.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;

import com.mindease.aop.annotations.AuditLogin;
import com.mindease.dto.AuthResponse;
import com.mindease.dto.ConvertAnonymousRequest;
import com.mindease.dto.ErrorResponse;
import com.mindease.dto.RefreshTokenRequest;
import com.mindease.dto.UserDTO;
import com.google.firebase.auth.FirebaseAuthException;
import com.mindease.model.RefreshToken;
import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.repository.UserRepository;
import com.mindease.service.EmailVerificationService;
import com.mindease.service.FirebaseService;
import com.mindease.service.RefreshTokenService;
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

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private FirebaseService firebaseService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

  @Autowired
  private EmailVerificationService emailVerificationService;

  @Autowired
  private UserRepository userRepository;

    @Operation(summary = "Register a new user", description = "Register a new user with Firebase authentication")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Registration successful", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request or user already exists", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid Firebase token", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
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
                    Boolean.TRUE.equals(request.getAnonymousMode()),
                    firebaseUid);

            // Track user activity on registration (async - fire-and-forget)
            userService.trackUserActivityAsync(user);

            // Send verification email (async - fire-and-forget)
            try {
                emailVerificationService.sendVerificationEmail(user);
            } catch (Exception e) {
                // Log but don't fail registration if email sending fails
                logger.warn("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
            }

            // Generate JWT token and refresh token
            String jwtToken = jwtUtil.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            return ResponseEntity
                    .ok(createAuthResponse(user, jwtToken, refreshToken.getToken(), "Registration successful"));

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(401)
                    .body(ErrorResponse.of("Invalid Firebase token: " + e.getMessage(), "INVALID_FIREBASE_TOKEN"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage(), "REGISTRATION_FAILED"));
        }
    }

    @Operation(summary = "Login user", description = "Authenticate user with Firebase token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid Firebase token", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/login")
    @AuditLogin
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = null;
        try {
            // Verify Firebase token
            String firebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

            // Find user by Firebase UID
            user = userService.findByFirebaseUid(firebaseUid)
                    .orElseThrow(() -> new RuntimeException("User not found. Please register first."));

            // Check if account is locked
            if (userService.isAccountLocked(user)) {
                return ResponseEntity.status(423).body(ErrorResponse.of(
                        "Account is temporarily locked due to too many failed login attempts. Please try again later.",
                        "ACCOUNT_LOCKED"));
            }

            // Reset failed login attempts on successful authentication
            userService.resetFailedLoginAttempts(user);

            // Track user activity on login (async - fire-and-forget)
            userService.trackUserActivityAsync(user);

            // Generate JWT token and refresh token
            String jwtToken = jwtUtil.generateToken(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            return ResponseEntity.ok(createAuthResponse(user, jwtToken, refreshToken.getToken(), "Login successful"));

        } catch (FirebaseAuthException e) {
            // Don't record failed login for Firebase service errors
            // Only record for invalid credential errors if distinguishable
            return ResponseEntity.status(401)
                    .body(ErrorResponse.of("Invalid Firebase token: " + e.getMessage(), "INVALID_FIREBASE_TOKEN"));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Login failed";
            if (msg.toLowerCase().contains("user not found")) {
                return ResponseEntity.status(404).body(ErrorResponse.of(msg, "USER_NOT_FOUND"));
            }
            // Record failed login attempt if user was found
            if (user != null) {
                userService.recordFailedLoginAttempt(user);
            }
            return ResponseEntity.badRequest().body(ErrorResponse.of(msg, "LOGIN_FAILED"));
        }
    }

    @Operation(summary = "Get current user", description = "Get current authenticated user information")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User information retrieved", content = @Content(schema = @Schema(implementation = UserDTO.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
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
            return ResponseEntity.status(404)
                    .body(ErrorResponse.of("User not found: " + e.getMessage(), "USER_NOT_FOUND"));
        }
    }

    @Operation(summary = "Refresh access token", description = "Get a new access token using a refresh token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully", content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            // Verify refresh token
            RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
            User user = refreshToken.getUser();

            // Generate new JWT token
            String newJwtToken = jwtUtil.generateToken(user);

            // Optionally rotate refresh token (create new one and revoke old one)
            refreshTokenService.revokeToken(refreshToken);
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

            return ResponseEntity.ok(
                    createAuthResponse(user, newJwtToken, newRefreshToken.getToken(), "Token refreshed successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(ErrorResponse.of(e.getMessage(), "INVALID_REFRESH_TOKEN"));
        }
    }

    @Operation(summary = "Logout user", description = "Revoke all refresh tokens for the current user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Revoke all refresh tokens
            refreshTokenService.revokeAllUserTokens(user);

            return ResponseEntity.ok(new AuthResponse("success", "Logout successful", null, null));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(ErrorResponse.of(e.getMessage(), "LOGOUT_FAILED"));
        }
    }

  @Operation(summary = "Convert anonymous account to full account", description = "Link anonymous account to email and password")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Account converted successfully",
      content = @Content(schema = @Schema(implementation = AuthResponse.class))),
    @ApiResponse(responseCode = "400", description = "Not an anonymous account or invalid request",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(responseCode = "401", description = "Unauthorized",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  @PostMapping("/convert-anonymous")
  public ResponseEntity<?> convertAnonymous(@RequestBody ConvertAnonymousRequest request, Authentication authentication) {
    try {
      String currentEmail = authentication.getName();
      User user = userService.findByEmail(currentEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));

      // Check if user is actually anonymous
      if (!user.getAnonymousMode()) {
        return ResponseEntity.badRequest().body(ErrorResponse.of("Account is not anonymous", "NOT_ANONYMOUS_ACCOUNT"));
      }

      // Verify the new Firebase token
      String newFirebaseUid = firebaseService.getUidFromToken(request.getFirebaseToken());

      // Check if email is already in use
      if (userRepository.existsByEmail(request.getEmail())) {
        return ResponseEntity.badRequest().body(ErrorResponse.of("Email is already in use", "EMAIL_IN_USE"));
      }

      // Update user account
      user.setEmail(request.getEmail());
      user.setFirebaseUid(newFirebaseUid);
      user.setAnonymousMode(false);
      userRepository.save(user);

      // Send verification email
      try {
        emailVerificationService.sendVerificationEmail(user);
      } catch (Exception e) {
        logger.warn("Failed to send verification email after conversion: {}", e.getMessage());
      }

      // Revoke old refresh tokens
      refreshTokenService.revokeAllUserTokens(user);

      // Generate new JWT and refresh token
      String jwtToken = jwtUtil.generateToken(user);
      RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

      logger.info("Converted anonymous account to full account for user: {}", user.getEmail());
      return ResponseEntity.ok(createAuthResponse(user, jwtToken, refreshToken.getToken(), "Account converted successfully"));

    } catch (org.springframework.dao.DataIntegrityViolationException e) {
      // Handle race condition: email uniqueness constraint violation
      return ResponseEntity.badRequest().body(ErrorResponse.of("Email is already in use", "EMAIL_IN_USE"));
    } catch (FirebaseAuthException e) {
      return ResponseEntity.status(401).body(ErrorResponse.of("Invalid Firebase token: " + e.getMessage(), "INVALID_FIREBASE_TOKEN"));
    } catch (Exception e) {
      logger.error("Failed to convert anonymous account", e);
      return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage(), "CONVERSION_FAILED"));
    }
  }

  @Operation(summary = "Send verification email", description = "Resend email verification link")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Verification email sent"),
    @ApiResponse(responseCode = "400", description = "Email already verified or invalid request"),
    @ApiResponse(responseCode = "401", description = "Unauthorized")
  })
  @PostMapping("/send-verification")
  public ResponseEntity<?> sendVerificationEmail(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.isEmailVerified()) {
                return ResponseEntity.badRequest()
                        .body(ErrorResponse.of("Email is already verified", "EMAIL_ALREADY_VERIFIED"));
            }

            emailVerificationService.sendVerificationEmail(user);
            return ResponseEntity.ok(new AuthResponse("success", "Verification email sent", null, null));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage(), "SEND_VERIFICATION_FAILED"));
        }
    }

    @Operation(summary = "Verify email", description = "Verify email address with token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired token")
    })
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            boolean verified = emailVerificationService.verifyEmail(token);

            if (verified) {
                return ResponseEntity.ok(new AuthResponse("success", "Email verified successfully", null, null));
            } else {
                return ResponseEntity.badRequest()
                        .body(ErrorResponse.of("Invalid or expired verification token", "INVALID_VERIFICATION_TOKEN"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ErrorResponse.of(e.getMessage(), "VERIFICATION_FAILED"));
        }
    }

    // Helper methods
    private AuthResponse createAuthResponse(User user, String token, String refreshToken, String message) {
        UserDTO userDTO = new UserDTO(user.getId(), user.getEmail(), user.getRole(), user.getAnonymousMode());
        return AuthResponse.success(message, token, refreshToken, userDTO);
    }

    // Request DTO classes
    public static class RegisterRequest {
        private String email;
        private String firebaseToken;
        private Boolean anonymousMode;

        // Getters and setters
        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getFirebaseToken() {
            return firebaseToken;
        }

        public void setFirebaseToken(String firebaseToken) {
            this.firebaseToken = firebaseToken;
        }

        public Boolean getAnonymousMode() {
            return anonymousMode;
        }

        public void setAnonymousMode(Boolean anonymousMode) {
            this.anonymousMode = anonymousMode;
        }
    }

    public static class LoginRequest {
        private String firebaseToken;

        // Getters and setters
        public String getFirebaseToken() {
            return firebaseToken;
        }

        public void setFirebaseToken(String firebaseToken) {
            this.firebaseToken = firebaseToken;
        }
    }
}
