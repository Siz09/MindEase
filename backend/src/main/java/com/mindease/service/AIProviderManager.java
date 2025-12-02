package com.mindease.service;

import com.mindease.config.AIProviderConfig;
import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.model.enums.AIProvider;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AIProviderManager {

    private static final Logger log = LoggerFactory.getLogger(AIProviderManager.class);

    @Autowired
    private AIProviderConfig config;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    @Qualifier("openAIChatBotService")
    private ChatBotService openAIService;

    @Autowired(required = false)
    private LocalAIChatBotService localAIService;

    private final Random random = new Random();

    public ChatResponse generateResponse(String message, String userId, List<Message> history,
                                         Map<String, String> userContext) {

        AIProvider selectedProvider = selectProvider(userId, userContext);
        log.info("Selected AI provider for user {}: {}", userId, selectedProvider);

        try {
            return generateWithProvider(selectedProvider, message, userId, history, userContext);
        } catch (Exception e) {
            log.error("Provider {} failed, attempting fallback", selectedProvider, e);
            return fallbackToAlternativeProvider(selectedProvider, message, userId, history, userContext);
        }
    }

    private AIProvider selectProvider(String userId, Map<String, String> userContext) {
        try {
            Optional<User> userOpt = userRepository.findById(UUID.fromString(userId));
            if (userOpt.isPresent() && userOpt.get().getPreferredAIProvider() != null) {
                AIProvider userPref = userOpt.get().getPreferredAIProvider();

                if (userPref != AIProvider.AUTO) {
                    return userPref;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch user preference: {}", e.getMessage());
        }

        String strategy = config.getSelectionStrategy();

        if ("AUTO".equals(strategy)) {
            return autoSelectProvider(userId, userContext);
        } else if ("ROUND_ROBIN".equals(strategy)) {
            return roundRobinSelect();
        }

        return AIProvider.OPENAI;
    }

    private AIProvider autoSelectProvider(String userId, Map<String, String> userContext) {
        if (config.getAutoSelection().isPreferLocalWhenProfileAvailable()) {
            try {
                Optional<User> userOpt = userRepository.findById(UUID.fromString(userId));
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (hasDetailedProfile(user)) {
                        return AIProvider.LOCAL;
                    }
                }
            } catch (Exception e) {
                log.warn("Auto-selection check failed: {}", e.getMessage());
            }
        }

        int percentage = config.getAutoSelection().getLoadBalancePercentage();
        if (random.nextInt(100) < percentage && isProviderEnabled("local")) {
            return AIProvider.LOCAL;
        }

        return AIProvider.OPENAI;
    }

    private AIProvider roundRobinSelect() {
        return System.currentTimeMillis() % 2 == 0 ? AIProvider.OPENAI : AIProvider.LOCAL;
    }

    private ChatResponse generateWithProvider(AIProvider provider, String message, String userId,
                                               List<Message> history, Map<String, String> userContext) {
        ChatBotService service = getService(provider);

        if (service == null) {
            throw new IllegalStateException("Provider " + provider + " is not available");
        }

        return service.generateResponse(message, userId, history, userContext);
    }

    private ChatResponse fallbackToAlternativeProvider(AIProvider failedProvider, String message,
                                                        String userId, List<Message> history,
                                                        Map<String, String> userContext) {

        AIProvider fallbackProvider = failedProvider == AIProvider.OPENAI ? AIProvider.LOCAL : AIProvider.OPENAI;

        log.info("Falling back to provider: {}", fallbackProvider);

        try {
            return generateWithProvider(fallbackProvider, message, userId, history, userContext);
        } catch (Exception e) {
            log.error("Fallback provider also failed", e);
            return new ChatResponse(
                "I'm having trouble connecting right now. Please try again in a moment.",
                false,
                "error"
            );
        }
    }

    private ChatBotService getService(AIProvider provider) {
        switch (provider) {
            case OPENAI:
                return openAIService;
            case LOCAL:
                return localAIService;
            default:
                return openAIService;
        }
    }

    private boolean isProviderEnabled(String providerName) {
        AIProviderConfig.ProviderSettings settings = config.getProviders().get(providerName);
        return settings != null && settings.isEnabled();
    }

    private boolean hasDetailedProfile(User user) {
        return user.getAge() != null &&
               user.getCourse() != null &&
               user.getCgpa() != null;
    }

    /**
     * Check if message contains crisis keywords
     * Delegates to OpenAI service for crisis detection
     */
    public boolean isCrisisMessage(String message) {
        if (openAIService != null) {
            return openAIService.isCrisisMessage(message);
        }
        // Basic fallback crisis detection
        if (message == null) return false;
        String lower = message.toLowerCase();
        return lower.contains("suicide") || lower.contains("kill myself") ||
               lower.contains("want to die") || lower.contains("end it all") ||
               lower.contains("harm myself");
    }
}
