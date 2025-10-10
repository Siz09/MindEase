package com.mindease.controller;

import com.mindease.model.User;
import com.mindease.dto.QuietHoursRequest;
import com.mindease.repository.UserRepository;
import com.mindease.service.UserService;
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
  public ResponseEntity<?> updateAnonymousMode(@PathVariable UUID id, @RequestBody Map<String, Boolean> request, Authentication authentication) {
    try {
      // Get the current user's email from authentication
      String currentUsername = authentication.getName();
      User currentUser = userRepository.findByEmail(currentUsername)
        .orElseThrow(() -> new RuntimeException("Current user not found"));

      // Check if the current user is the same as the target user or an admin
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

  @PatchMapping("/quiet-hours")
  public ResponseEntity<User> updateQuietHours(@RequestBody QuietHoursRequest request, Authentication authentication) {
    String email = authentication.getName();
    User updated = userService.updateQuietHours(email, request);
    return ResponseEntity.ok(updated);
  }

}
