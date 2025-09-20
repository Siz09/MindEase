package com.mindease.controller;

import com.mindease.model.Role;
import com.mindease.model.User;
import com.mindease.repository.UserRepository;
import com.mindease.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/dev")
public class DevAuthController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private JwtUtil jwtUtil;

  @Value("${spring.profiles.active:}")
  private String activeProfile;

  @PostMapping("/login-test")
  public ResponseEntity<?> devLogin(@RequestBody DevLoginRequest request) {
    // Only allow this in development mode
    if (!isDevelopmentMode()) {
      return ResponseEntity.badRequest().body(createErrorResponse("This endpoint is only available in development mode"));
    }

    try {
      String email = request.getEmail();
      Optional<User> userOptional = userRepository.findByEmail(email);

      User user;
      if (userOptional.isPresent()) {
        user = userOptional.get();
      } else {
        // Create a new test user if it doesn't exist
        user = new User();
        user.setEmail(email);
        user.setRole(Role.USER);
        user.setAnonymousMode(false);
        user.setFirebaseUid("dev-test-uid-" + UUID.randomUUID());
        user = userRepository.save(user);
      }

      // Generate JWT token
      String jwtToken = jwtUtil.generateToken(user);

      Map<String, Object> response = new HashMap<>();
      response.put("message", "Development login successful");
      response.put("status", "success");
      response.put("token", jwtToken);

      Map<String, Object> userInfo = new HashMap<>();
      userInfo.put("id", user.getId());
      userInfo.put("email", user.getEmail());
      userInfo.put("role", user.getRole());
      userInfo.put("anonymousMode", user.getAnonymousMode());

      response.put("user", userInfo);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Development login failed: " + e.getMessage()));
    }
  }

  private boolean isDevelopmentMode() {
    return "dev".equals(activeProfile) || activeProfile.contains("development");
  }

  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("message", message);
    response.put("status", "error");
    return response;
  }

  public static class DevLoginRequest {
    private String email;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }
  }
}
