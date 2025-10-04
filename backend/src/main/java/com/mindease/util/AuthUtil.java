package com.mindease.util;

import com.mindease.service.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class AuthUtil {

  public UUID getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()) {
      Object principal = authentication.getPrincipal();
      
      // If it's a CustomUserDetails, extract the user ID
      if (principal instanceof CustomUserDetails) {
        return ((CustomUserDetails) principal).getId();
      }
      
      // If it's just a username string, we need to look up the user
      if (principal instanceof String) {
        String username = (String) principal;
        throw new RuntimeException("Cannot extract user ID from username: " + username + ". User ID should be stored in JWT token.");
      }
      
      throw new RuntimeException("Unsupported authentication principal type: " + principal.getClass().getSimpleName());
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
