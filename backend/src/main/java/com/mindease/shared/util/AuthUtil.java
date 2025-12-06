package com.mindease.shared.util;

import com.mindease.shared.exception.UnauthenticatedException;
import com.mindease.shared.exception.UserNotFoundException;
import com.mindease.auth.repository.UserRepository;
import com.mindease.shared.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AuthUtil {

    @Autowired
    private UserRepository userRepository;

    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthenticatedException("User not authenticated");
        }

        Object principal = authentication.getPrincipal();

        // Preferred path: CustomUserDetails already carries the UUID
        if (principal instanceof CustomUserDetails) {
            return ((CustomUserDetails) principal).getId();
        }

        // Fallback: resolve by email from authentication name
        String email = authentication.getName();
        if (email == null || email.isEmpty()) {
            throw new UnauthenticatedException("Unable to resolve current user");
        }

        return userRepository
                .findByEmail(email)
                .map(u -> u.getId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        throw new UnauthenticatedException("User not authenticated");
    }
}
