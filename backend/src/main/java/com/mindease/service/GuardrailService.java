package com.mindease.service;

import com.mindease.model.ModerationAction;
import com.mindease.model.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Service for checking and moderating AI-generated responses to ensure safety.
 * Detects and handles potentially harmful content in bot responses.
 */
@Service
public class GuardrailService {

    private static final Logger log = LoggerFactory.getLogger(GuardrailService.class);

    // Patterns that should never appear in bot responses
    private static final List<String> PROHIBITED_CONTENT = List.of(
        "you should kill",
        "you should harm",
        "suicide is the answer",
        "end your life",
        "better off dead",
        "no reason to live",
        "you deserve to suffer"
    );

    // Patterns that need careful handling but aren't outright prohibited
    private static final List<String> SENSITIVE_CONTENT = List.of(
        "kill yourself",
        "harm yourself",
        "suicide method",
        "how to die",
        "ways to hurt",
        "ending it all"
    );

    // Patterns indicating the bot is trying to diagnose
    private static final List<String> DIAGNOSIS_PATTERNS = List.of(
        "you have depression",
        "you are bipolar",
        "you have ptsd",
        "diagnosed with",
        "you suffer from",
        "you have a mental illness"
    );

    // Safe fallback response for blocked content
    private static final String SAFE_FALLBACK =
        "I want to support you through this difficult time. Your feelings are valid and important. " +
        "If you're experiencing thoughts of self-harm or suicide, please reach out to a crisis helpline " +
        "or emergency services immediately. They have trained professionals who can provide the support you need right now.";

    /**
     * Check an AI response for safety issues and determine moderation action.
     *
     * @param response The AI-generated response
     * @param userRiskLevel The risk level of the user's message
     * @return Result containing moderation action, reason, and potentially modified response
     */
    public GuardrailResult checkResponse(String response, RiskLevel userRiskLevel) {
        if (response == null || response.isBlank()) {
            return new GuardrailResult(
                ModerationAction.BLOCKED,
                "Empty response",
                SAFE_FALLBACK
            );
        }

        String normalized = response.toLowerCase(Locale.ROOT);

        // Check for prohibited content - always block
        for (String prohibited : PROHIBITED_CONTENT) {
            if (normalized.contains(prohibited)) {
                log.error("BLOCKED: Prohibited content detected in AI response: {}", prohibited);
                return new GuardrailResult(
                    ModerationAction.BLOCKED,
                    "Prohibited content: " + prohibited,
                    SAFE_FALLBACK
                );
            }
        }

        // Check for inappropriate diagnosis attempts
        for (String diagnosisPattern : DIAGNOSIS_PATTERNS) {
            if (normalized.contains(diagnosisPattern)) {
                log.warn("FLAGGED: Diagnosis attempt detected in AI response");
                return new GuardrailResult(
                    ModerationAction.FLAGGED,
                    "Attempted diagnosis: " + diagnosisPattern,
                    response
                );
            }
        }

        // Check for sensitive content - flag or modify based on risk level
        for (String sensitive : SENSITIVE_CONTENT) {
            if (normalized.contains(sensitive)) {
                log.warn("FLAGGED: Sensitive content detected in AI response: {}", sensitive);

                // For high-risk users, be extra cautious
                if (userRiskLevel.ordinal() >= RiskLevel.HIGH.ordinal()) {
                    return new GuardrailResult(
                        ModerationAction.MODIFIED,
                        "Sensitive content removed for high-risk user: " + sensitive,
                        removeSensitiveContent(response)
                    );
                } else {
                    return new GuardrailResult(
                        ModerationAction.FLAGGED,
                        "Sensitive content detected: " + sensitive,
                        response
                    );
                }
            }
        }

        // Check response length - overly long responses can be problematic
        if (response.length() > 2000) {
            log.info("FLAGGED: Response too long ({} chars)", response.length());
            return new GuardrailResult(
                ModerationAction.FLAGGED,
                "Response too long: " + response.length() + " chars",
                response
            );
        }

        // Check if response is too dismissive for high-risk situations
        if (userRiskLevel.ordinal() >= RiskLevel.HIGH.ordinal()) {
            if (isDismissive(normalized)) {
                log.warn("MODIFIED: Dismissive response detected for high-risk user");
                return new GuardrailResult(
                    ModerationAction.MODIFIED,
                    "Response too dismissive for high-risk situation",
                    addEmpatheticPrefix(response)
                );
            }
        }

        // All checks passed
        return new GuardrailResult(ModerationAction.NONE, null, response);
    }

    /**
     * Check if a response is dismissive (problematic for high-risk users).
     */
    private boolean isDismissive(String normalized) {
        List<String> dismissivePatterns = List.of(
            "just think positive",
            "cheer up",
            "it's not that bad",
            "others have it worse",
            "you're overreacting",
            "snap out of it"
        );

        for (String pattern : dismissivePatterns) {
            if (normalized.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Remove sensitive content from response.
     * Simple implementation - more sophisticated NLP could improve this.
     */
    private String removeSensitiveContent(String response) {
        String modified = response;

        for (String sensitive : SENSITIVE_CONTENT) {
            // Replace sensitive phrases with ellipsis
            modified = Pattern.compile(Pattern.quote(sensitive), Pattern.CASE_INSENSITIVE)
                .matcher(modified)
                .replaceAll("[content removed for safety]");
        }

        // If too much was removed, use fallback
        if (modified.contains("[content removed for safety]")) {
            return addEmpatheticPrefix(modified) + "\n\n" +
                   "I want to ensure I'm providing you with safe and supportive guidance. " +
                   "Please consider reaching out to a crisis professional who can provide immediate help.";
        }

        return modified;
    }

    /**
     * Add an empathetic prefix to a response.
     */
    private String addEmpatheticPrefix(String response) {
        return "I hear that you're going through a really difficult time, and I want you to know that your feelings are valid. " +
               response;
    }

    /**
     * Result of guardrail check.
     */
    public static class GuardrailResult {
        private final ModerationAction action;
        private final String reason;
        private final String finalResponse;

        public GuardrailResult(ModerationAction action, String reason, String finalResponse) {
            this.action = action;
            this.reason = reason;
            this.finalResponse = finalResponse;
        }

        public ModerationAction getAction() {
            return action;
        }

        public String getReason() {
            return reason;
        }

        public String getFinalResponse() {
            return finalResponse;
        }

        public boolean wasModerated() {
            return action != ModerationAction.NONE;
        }
    }
}
