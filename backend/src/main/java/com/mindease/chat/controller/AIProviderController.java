package com.mindease.chat.controller;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.chat.dto.CurrentProviderResponse;
import com.mindease.chat.dto.ProviderUpdateResponse;
import com.mindease.chat.model.enums.AIProvider;
import com.mindease.shared.config.AIProviderConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/chat/provider")
public class AIProviderController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIProviderConfig aiProviderConfig;

    @GetMapping
    public ResponseEntity<CurrentProviderResponse> getCurrentProvider(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new IllegalStateException("Authenticated user not found");
        }

        User user = userOpt.get();
        AIProvider provider = user.getPreferredAIProvider() != null
                ? user.getPreferredAIProvider()
                : AIProvider.OPENAI;

        CurrentProviderResponse response = new CurrentProviderResponse(
                provider.name(),
                AIProvider.values());

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<ProviderUpdateResponse> updateProvider(@RequestBody ProviderRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            throw new IllegalStateException("Authenticated user not found");
        }

        User user = userOpt.get();

        try {
            if (request.getProvider() == null || request.getProvider().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(new ProviderUpdateResponse("error", "Provider cannot be null or empty"));
            }

            AIProvider provider = AIProvider.valueOf(request.getProvider().toUpperCase());

            // Validate that the provider is enabled (unless it's AUTO)
            if (provider != AIProvider.AUTO && !isProviderEnabled(provider)) {
                return ResponseEntity.badRequest()
                        .body(new ProviderUpdateResponse("error",
                                "Provider " + provider + " is not currently enabled"));
            }

            user.setPreferredAIProvider(provider);
            userRepository.save(user);

            ProviderUpdateResponse response = new ProviderUpdateResponse("success", provider.name());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ProviderUpdateResponse("error", "Invalid provider: " + request.getProvider()));
        }
    }

    private boolean isProviderEnabled(AIProvider provider) {
        String providerName = provider.name().toLowerCase();
        AIProviderConfig.ProviderSettings settings = aiProviderConfig.getProviders().get(providerName);
        return settings != null && settings.isEnabled();
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
