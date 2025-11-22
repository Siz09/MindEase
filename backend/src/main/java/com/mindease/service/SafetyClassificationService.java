package com.mindease.service;

import com.mindease.model.Message;
import com.mindease.model.RiskLevel;
import com.mindease.repository.CrisisResourceRepository;
import com.mindease.model.CrisisResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Service for classifying message risk levels and providing crisis resources.
 * Uses keyword-based detection with configurable patterns.
 */
@Service
public class SafetyClassificationService {

    private static final Logger log = LoggerFactory.getLogger(SafetyClassificationService.class);

    @Autowired
    private CrisisResourceRepository crisisResourceRepository;

    // Risk classification keywords by level
    private static final Map<RiskLevel, List<String>> RISK_KEYWORDS = new HashMap<>();

    static {
        // CRITICAL - Immediate danger, active intent
        RISK_KEYWORDS.put(RiskLevel.CRITICAL, List.of(
                "kill myself", "suicide plan", "end my life", "going to die",
                "goodbye forever", "final message", "overdose", "jump off",
                "hanging myself", "cutting deep", "want to die today"));

        // HIGH - Suicidal ideation, self-harm intent
        RISK_KEYWORDS.put(RiskLevel.HIGH, List.of(
                "suicid", "kill me", "end it all", "better off dead",
                "no reason to live", "wish i was dead", "want to die",
                "self harm", "cut myself", "hurt myself badly"));

        // MEDIUM - Self-harm thoughts, moderate distress
        RISK_KEYWORDS.put(RiskLevel.MEDIUM, List.of(
                "harm myself", "hurt myself", "cutting", "self injur",
                "thoughts of dying", "life isn't worth", "feel worthless",
                "everyone would be better", "nothing matters", "no point"));

        // LOW - Mild distress, negative mood
        RISK_KEYWORDS.put(RiskLevel.LOW, List.of(
                "hopeless", "helpless", "empty inside", "numb",
                "can't cope", "breaking down", "falling apart",
                "exhausted", "burned out", "can't take it"));
    }

    /**
     * Classify a message's risk level based on content and context.
     *
     * @param content       The message content to classify
     * @param recentHistory Recent messages for context (optional)
     * @return The assessed risk level
     */
    public RiskLevel classifyMessage(String content, List<Message> recentHistory) {
        if (content == null || content.isBlank()) {
            return RiskLevel.NONE;
        }

        String normalized = content.toLowerCase(Locale.ROOT);

        // Check from highest risk to lowest
        if (containsKeywords(normalized, RISK_KEYWORDS.get(RiskLevel.CRITICAL))) {
            log.warn("CRITICAL risk detected in message");
            return RiskLevel.CRITICAL;
        }

        if (containsKeywords(normalized, RISK_KEYWORDS.get(RiskLevel.HIGH))) {
            log.warn("HIGH risk detected in message");
            return RiskLevel.HIGH;
        }

        if (containsKeywords(normalized, RISK_KEYWORDS.get(RiskLevel.MEDIUM))) {
            log.info("MEDIUM risk detected in message");
            return RiskLevel.MEDIUM;
        }

        if (containsKeywords(normalized, RISK_KEYWORDS.get(RiskLevel.LOW))) {
            log.debug("LOW risk detected in message");
            return RiskLevel.LOW;
        }

        // Check history for escalating distress patterns
        if (recentHistory != null && !recentHistory.isEmpty()) {
            RiskLevel historicalRisk = analyzeHistoricalPattern(recentHistory);
            if (historicalRisk.ordinal() > RiskLevel.NONE.ordinal()) {
                return historicalRisk;
            }
        }

        return RiskLevel.NONE;
    }

    /**
     * Get appropriate crisis resources for a risk level and user language.
     *
     * @param riskLevel The risk level
     * @param language  User's preferred language (e.g., "en", "ne")
     * @param region    User's region (e.g., "US", "NP", or null for global)
     * @return List of crisis resources
     */
    @Cacheable(value = "crisisResources", key = "#language + '_' + #region")
    public List<CrisisResource> getCrisisResources(RiskLevel riskLevel, String language, String region) {
        // Only provide resources for HIGH and CRITICAL
        if (riskLevel.ordinal() < RiskLevel.HIGH.ordinal()) {
            return List.of();
        }

        String effectiveLanguage = language != null ? language : "en";
        String effectiveRegion = region != null ? region : "global";

        try {
            // Try to get region-specific + global resources
            List<CrisisResource> resources = crisisResourceRepository
                    .findByLanguageAndRegionOrGlobal(effectiveLanguage, effectiveRegion);

            if (resources.isEmpty()) {
                // Fallback to English if no resources in user's language
                log.warn("No crisis resources found for language: {}, falling back to English", effectiveLanguage);
                resources = crisisResourceRepository.findByLanguageAndActiveTrueOrderByDisplayOrder("en");
            }

            return resources;
        } catch (Exception e) {
            log.error("Error fetching crisis resources: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Generate a safety prompt adjustment based on risk level.
     * This can be added to the AI system prompt for risk-aware responses.
     *
     * @param riskLevel The assessed risk level
     * @return Additional prompt instructions
     */
    public String getSafetyPrompt(RiskLevel riskLevel) {
        return switch (riskLevel) {
            case CRITICAL -> "CRISIS MODE: The user is in immediate danger. Acknowledge their pain with deep empathy. "
                    +
                    "Strongly encourage them to reach out to emergency services or a crisis helpline immediately. " +
                    "Be calm, direct, and supportive. Do not try to solve complex issues—focus on immediate safety.";

            case HIGH -> "HIGH RISK: The user is expressing serious distress and may be considering self-harm. " +
                    "Respond with compassion and validation. Gently suggest professional help and crisis resources. " +
                    "Avoid judgmental language. Focus on hope and connection.";

            case MEDIUM -> "MODERATE CONCERN: The user is experiencing significant distress. " +
                    "Be extra supportive and validate their feelings. Explore coping strategies and suggest " +
                    "professional support if appropriate. Monitor for escalation.";

            case LOW -> "MILD CONCERN: The user is experiencing some distress. " +
                    "Provide empathetic support and gentle encouragement. Ask clarifying questions.";

            default -> "";
        };
    }

    /**
     * Check if text contains any keywords from a list, with basic negation
     * handling.
     * Uses word boundaries and avoids counting negated phrases as positive matches.
     */
    private boolean containsKeywords(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return false;
        }

        // Common negation patterns (e.g., "don't", "never", "not")
        String negationPattern = "\\b(don't|dont|do not|never|not|no|wont|won't|will not)\\s+\\w*\\s*";

        for (String keyword : keywords) {
            // Use word boundaries for more precise matching
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b", Pattern.CASE_INSENSITIVE);
            var matcher = pattern.matcher(text);

            while (matcher.find()) {
                // Check if match is preceded by negation (within ~20 chars)
                int start = Math.max(0, matcher.start() - 20);
                String context = text.substring(start, matcher.start());

                if (!context.matches(".*" + negationPattern + "$")) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Analyze recent message history for escalating distress patterns.
     * Returns elevated risk if multiple concerning messages in sequence.
     */
    private RiskLevel analyzeHistoricalPattern(List<Message> history) {
        if (history.size() < 3) {
            return RiskLevel.NONE;
        }

        // Get last 5 user messages
        List<Message> userMessages = history.stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsUserMessage()))
                .limit(5)
                .toList();

        int lowRiskCount = 0;
        int mediumPlusRiskCount = 0;

        for (Message msg : userMessages) {
            RiskLevel msgRisk = msg.getRiskLevel();
            if (msgRisk == null)
                continue;

            if (msgRisk.ordinal() >= RiskLevel.MEDIUM.ordinal()) {
                mediumPlusRiskCount++;
            } else if (msgRisk == RiskLevel.LOW) {
                lowRiskCount++;
            }
        }

        // Escalate if seeing pattern of distress
        if (mediumPlusRiskCount >= 2) {
            return RiskLevel.HIGH;
        } else if (mediumPlusRiskCount >= 1 && lowRiskCount >= 2) {
            return RiskLevel.MEDIUM;
        } else if (lowRiskCount >= 3) {
            return RiskLevel.LOW;
        }

        return RiskLevel.NONE;
    }
}
