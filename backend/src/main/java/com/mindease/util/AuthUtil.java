package com.mindease.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class AuthUtil {

  public UUID getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated()) {
      // This depends on how you store user ID in your authentication
      // For now, return a mock UUID - you'll need to adjust this
      return UUID.randomUUID();
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
