package com.mindease.shared.security;

import com.mindease.shared.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class CurrentUserId {
    private CurrentUserId() {
    }

    public static UUID get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            return cud.getId();
        }
        if (principal instanceof String username) {
            throw new IllegalStateException("Cannot extract user ID from username: " + username);
        }
        throw new IllegalStateException(
                "Unsupported authentication principal type: " + principal.getClass().getSimpleName());
    }
}
