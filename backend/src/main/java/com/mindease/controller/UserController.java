package com.mindease.controller;

import com.mindease.model.User;
import com.mindease.dto.QuietHoursRequest;
import com.mindease.repository.UserRepository;
import com.mindease.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

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
}
