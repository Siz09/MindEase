package com.mindease.controller;

import com.mindease.model.User;
import com.mindease.model.enums.AIProvider;
import com.mindease.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat/provider")
@CrossOrigin(origins = "*")
public class AIProviderController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getCurrentProvider(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();
        AIProvider provider = user.getPreferredAIProvider() != null
            ? user.getPreferredAIProvider()
            : AIProvider.OPENAI;

        Map<String, Object> response = new HashMap<>();
        response.put("currentProvider", provider.name());
        response.put("availableProviders", AIProvider.values());

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> updateProvider(@RequestBody ProviderRequest request,
                                           Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();

        try {
            AIProvider provider = AIProvider.valueOf(request.getProvider().toUpperCase());
            user.setPreferredAIProvider(provider);
            userRepository.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("provider", provider.name());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid provider: " + request.getProvider());
        }
    }

    public static class ProviderRequest {
        private String provider;

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }
    }
}
