package com.mindease.controller;

import com.mindease.model.User;
import com.mindease.dto.QuietHoursRequest;
import com.mindease.repository.UserRepository;
import com.mindease.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/users", "/api/user"})
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable UUID id) {
        return userRepository.findById(id).orElse(null);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PatchMapping("/{id}/anonymous-mode")
    public ResponseEntity<?> updateAnonymousMode(@PathVariable UUID id, @RequestBody Map<String, Boolean> request,
            Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByEmail(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            if (!currentUser.getId().equals(id) && currentUser.getRole() != com.mindease.model.Role.ADMIN) {
                return ResponseEntity.status(403).body("Access denied");
            }

            Boolean anonymousMode = request.get("anonymousMode");
            if (anonymousMode == null) {
                return ResponseEntity.badRequest().body("anonymousMode field is required");
            }

            User updatedUser = userService.toggleAnonymousMode(id, anonymousMode);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Updated endpoint with validation + consistent error handling
    @PatchMapping("/quiet-hours")
    public ResponseEntity<?> updateQuietHours(
            @Valid @RequestBody QuietHoursRequest request,
            Authentication authentication) {
        try {
            if (request == null) {
                return ResponseEntity.badRequest().body("Request body is required");
            }

            if (request.getQuietHoursStart() == null || request.getQuietHoursEnd() == null) {
                return ResponseEntity.badRequest().body("Both quietHoursStart and quietHoursEnd are required");
            }

            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Authentication required");
            }

            String email = authentication.getName();
            User updatedUser = userService.updateQuietHours(email, request);
            return ResponseEntity.ok(updatedUser);

        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // GET /api/user/profile - Get current user profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Authentication required"));
            }

            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("anonymousMode", user.getAnonymousMode());

            // Include quiet hours if available
            if (user.getQuietHoursStart() != null && user.getQuietHoursEnd() != null) {
                userInfo.put("quietHoursStart", user.getQuietHoursStart());
                userInfo.put("quietHoursEnd", user.getQuietHoursEnd());
            }

            response.put("user", userInfo);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to get profile for user: {}", authentication != null ? authentication.getName() : "unknown", e);
            return ResponseEntity.status(500).body(createErrorResponse("Failed to get profile"));
        }
    }

    // PUT/PATCH /api/user/profile - Update user profile
    @PutMapping("/profile")
    @PatchMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Authentication required"));
            }

            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update allowed fields
            if (updates.containsKey("quietHoursStart") && updates.containsKey("quietHoursEnd")) {
                QuietHoursRequest quietHours = new QuietHoursRequest();
                Object startObj = updates.get("quietHoursStart");
                Object endObj = updates.get("quietHoursEnd");

                LocalTime startTime;
                LocalTime endTime;

                if (startObj instanceof String) {
                    startTime = LocalTime.parse((String) startObj);
                } else if (startObj instanceof LocalTime) {
                    startTime = (LocalTime) startObj;
                } else {
                    return ResponseEntity.badRequest().body(createErrorResponse("quietHoursStart must be a string or LocalTime"));
                }

                if (endObj instanceof String) {
                    endTime = LocalTime.parse((String) endObj);
                } else if (endObj instanceof LocalTime) {
                    endTime = (LocalTime) endObj;
                } else {
                    return ResponseEntity.badRequest().body(createErrorResponse("quietHoursEnd must be a string or LocalTime"));
                }

                quietHours.setQuietHoursStart(startTime);
                quietHours.setQuietHoursEnd(endTime);
                user = userService.updateQuietHours(email, quietHours);
            }

            // Anonymous mode update
            if (updates.containsKey("anonymousMode")) {
                Object anonymousModeObj = updates.get("anonymousMode");
                if (anonymousModeObj instanceof Boolean) {
                    user = userService.toggleAnonymousMode(user.getId(), (Boolean) anonymousModeObj);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Profile updated successfully");

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("anonymousMode", user.getAnonymousMode());

            response.put("user", userInfo);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to update profile for user: {}", authentication != null ? authentication.getName() : "unknown", e);
            return ResponseEntity.status(500).body(createErrorResponse("Failed to update profile"));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", message);
        return response;
    }
}
