package com.mindease.service;

import com.mindease.config.AIProviderConfig;
import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.model.enums.AIProvider;
import com.mindease.model.enums.SelectionStrategy;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

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
    private final AtomicLong roundRobinCounter = new AtomicLong(0);

    public ChatResponse generateResponse(String message, String userId, List<Message> history,
                                         Map<String, String> userContext) {

        AIProvider selectedProvider = selectProvider(userId, userContext);
        log.info("Selected AI provider: {}", selectedProvider);

        try {
            return generateWithProvider(selectedProvider, message, userId, history, userContext);
        } catch (Exception e) {
            log.error("Provider {} failed, attempting fallback", selectedProvider, e);
            return fallbackToAlternativeProvider(selectedProvider, message, userId, history, userContext);
        }
    }

    private AIProvider selectProvider(String userId, Map<String, String> userContext) {
        Optional<User> userOpt = Optional.empty();
        try {
            userOpt = userRepository.findById(UUID.fromString(userId));
            if (userOpt.isPresent() && userOpt.get().getPreferredAIProvider() != null) {
                AIProvider userPref = userOpt.get().getPreferredAIProvider();

                if (userPref != AIProvider.AUTO) {
                    return userPref;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch user preference: {}", e.getMessage());
        }

        SelectionStrategy strategy = config.getSelectionStrategy();

        if (strategy == SelectionStrategy.AUTO) {
            return autoSelectProvider(userOpt, userContext);
        } else if (strategy == SelectionStrategy.ROUND_ROBIN) {
            return roundRobinSelect();
        }

        // Default to OpenAI if enabled, otherwise select first enabled provider
        if (isProviderEnabled("openai")) {
            return AIProvider.OPENAI;
        }
        return getFirstEnabledProvider();
    }

    private AIProvider autoSelectProvider(Optional<User> userOpt, Map<String, String> userContext) {
        if (config.getAutoSelection().isPreferLocalWhenProfileAvailable()) {
            try {
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    if (hasDetailedProfile(user) && isProviderEnabled("local")) {
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

        // Check if OpenAI is enabled before returning it
        if (isProviderEnabled("openai")) {
            return AIProvider.OPENAI;
        }

        // If OpenAI is disabled, return first enabled provider
        return getFirstEnabledProvider();
    }

    private AIProvider roundRobinSelect() {
        List<AIProvider> enabledProviders = new ArrayList<>();

        if (isProviderEnabled("openai")) {
            enabledProviders.add(AIProvider.OPENAI);
        }
        if (isProviderEnabled("local")) {
            enabledProviders.add(AIProvider.LOCAL);
        }

        if (enabledProviders.isEmpty()) {
            throw new IllegalStateException("No enabled providers available for round-robin selection");
        }

        long count = roundRobinCounter.getAndIncrement();
        int index = (int) (count % enabledProviders.size());
        return enabledProviders.get(index);
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

    private AIProvider getFirstEnabledProvider() {
        if (isProviderEnabled("openai")) {
            return AIProvider.OPENAI;
        }
        if (isProviderEnabled("local")) {
            return AIProvider.LOCAL;
        }
        throw new IllegalStateException("No enabled AI providers available");
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
