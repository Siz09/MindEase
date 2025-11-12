package com.mindease.util;

import com.mindease.repository.UserRepository;
import com.mindease.service.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AuthUtil {

  @Autowired
  private UserRepository userRepository;

  public UUID getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()) {
      Object principal = authentication.getPrincipal();

      // CustomUserDetails holds the UUID directly
      if (principal instanceof CustomUserDetails) {
        return ((CustomUserDetails) principal).getId();
      }

      // Spring Security may set principal to a username (email). Look it up.
      if (principal instanceof String) {
        String username = (String) principal; // typically the email
        return userRepository
            .findByEmail(username)
            .map(u -> u.getId())
            .orElseThrow(() -> new RuntimeException("Cannot resolve user by username: " + username));
      }

      // Fallback: use authentication.getName() if present
      String name = authentication.getName();
      if (name != null) {
        return userRepository
            .findByEmail(name)
            .map(u -> u.getId())
            .orElseThrow(() -> new RuntimeException("Cannot resolve user by name: " + name
                + " (principal type: " + principal.getClass().getSimpleName() + ")"));
      }

      throw new RuntimeException("Unsupported authentication principal type: "
          + principal.getClass().getSimpleName());
    }
    throw new RuntimeException("User not authenticated");
  }

  public String getCurrentUsername() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()) {
      return authentication.getName();
    }
    throw new RuntimeException("User not authenticated");
  }
}
