package com.mindease.auth.controller;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.auth.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/users", "/api/user" })
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

            if (!currentUser.getId().equals(id) && currentUser.getRole() != Role.ADMIN) {
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

            // Include demographic profile fields if available
            if (user.getAge() != null)
                userInfo.put("age", user.getAge());
            if (user.getGender() != null)
                userInfo.put("gender", user.getGender());
            if (user.getCourse() != null)
                userInfo.put("course", user.getCourse());
            if (user.getYear() != null)
                userInfo.put("year", user.getYear());
            if (user.getCgpa() != null)
                userInfo.put("cgpa", user.getCgpa());
            if (user.getMaritalStatus() != null)
                userInfo.put("maritalStatus", user.getMaritalStatus());

            // Include behavioral fields for AI risk model if available
            if (user.getDaysIndoors() != null)
                userInfo.put("daysIndoors", user.getDaysIndoors());
            if (user.getChangesHabits() != null)
                userInfo.put("changesHabits", user.getChangesHabits());
            if (user.getWorkInterest() != null)
                userInfo.put("workInterest", user.getWorkInterest());
            if (user.getSocialWeakness() != null)
                userInfo.put("socialWeakness", user.getSocialWeakness());

            response.put("user", userInfo);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to get profile for user: {}",
                    authentication != null ? authentication.getName() : "unknown", e);
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
            // Anonymous mode update
            if (updates.containsKey("anonymousMode")) {
                Object anonymousModeObj = updates.get("anonymousMode");
                if (anonymousModeObj instanceof Boolean) {
                    user = userService.toggleAnonymousMode(user.getId(), (Boolean) anonymousModeObj);
                }
            }

            // Update demographic profile fields
            if (updates.containsKey("age"))
                user.setAge((Integer) updates.get("age"));
            if (updates.containsKey("gender"))
                user.setGender((String) updates.get("gender"));
            if (updates.containsKey("course"))
                user.setCourse((String) updates.get("course"));
            if (updates.containsKey("year"))
                user.setYear((String) updates.get("year"));
            if (updates.containsKey("cgpa"))
                user.setCgpa((Double) updates.get("cgpa"));
            if (updates.containsKey("maritalStatus"))
                user.setMaritalStatus((String) updates.get("maritalStatus"));

            // Update behavioral fields for AI risk model
            if (updates.containsKey("daysIndoors"))
                user.setDaysIndoors((String) updates.get("daysIndoors"));
            if (updates.containsKey("changesHabits"))
                user.setChangesHabits((String) updates.get("changesHabits"));
            if (updates.containsKey("workInterest"))
                user.setWorkInterest((String) updates.get("workInterest"));
            if (updates.containsKey("socialWeakness"))
                user.setSocialWeakness((String) updates.get("socialWeakness"));

            // Update preferred language
            if (updates.containsKey("preferredLanguage")) {
                String preferredLanguage = (String) updates.get("preferredLanguage");
                if (preferredLanguage != null && (preferredLanguage.equals("en") || preferredLanguage.equals("ne"))) {
                    user.setPreferredLanguage(preferredLanguage);
                }
            }

            // Save changes if any profile fields were updated
            if (updates.keySet().stream()
                    .anyMatch(key -> key.equals("age") || key.equals("gender") || key.equals("course") ||
                            key.equals("year") || key.equals("cgpa") || key.equals("maritalStatus") ||
                            key.equals("daysIndoors") || key.equals("changesHabits") ||
                            key.equals("workInterest") || key.equals("socialWeakness") ||
                            key.equals("preferredLanguage"))) {
                user = userRepository.save(user);
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
            log.error("Failed to update profile for user: {}",
                    authentication != null ? authentication.getName() : "unknown", e);
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
