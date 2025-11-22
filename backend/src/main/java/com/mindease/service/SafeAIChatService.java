package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.*;
import com.mindease.repository.CrisisResourceRepository;
import com.mindease.service.GuardrailService.GuardrailResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Enhanced ChatBotService that wraps the base AI service with safety checks.
 * Integrates SafetyClassificationService and GuardrailService into the chat flow.
 */
@Service
@Qualifier("safeAIChatService")
public class SafeAIChatService implements ChatBotService {

    private static final Logger log = LoggerFactory.getLogger(SafeAIChatService.class);

    @Autowired
    @Qualifier("openAIChatBotService")
    private ChatBotService baseChatService; // Delegate to OpenAIChatBotService

    @Autowired
    private SafetyClassificationService safetyService;

    @Autowired
    private GuardrailService guardrailService;

    @Autowired
    private CrisisResourceRepository crisisResourceRepository;

    @Override
    public ChatResponse generateResponse(String message, String userId, List<Message> history) {
        try {
            // Step 1: Classify user message risk level
            RiskLevel riskLevel = safetyService.classifyMessage(message, history);
            log.info("Message classified as risk level: {} for user: {}", riskLevel, userId);

            // Step 2: Get base AI response (which already includes some safety logic)
            ChatResponse baseResponse = baseChatService.generateResponse(message, userId, history);
            if (baseResponse == null) {
                throw new IllegalStateException("Base chat service returned null response");
            }

            // Step 3: Apply guardrails to AI response
            GuardrailResult guardrailResult = guardrailService.checkResponse(
                baseResponse.getContent(),
                riskLevel
            );
            if (guardrailResult == null) {
                throw new IllegalStateException("Guardrail service returned null result");
            }

            // Step 4: Create enhanced response with safety metadata
            ChatResponse enhancedResponse = new ChatResponse();
            enhancedResponse.setContent(guardrailResult.getFinalResponse());
            enhancedResponse.setCrisisFlagged(riskLevel.isHighOrCritical());
            enhancedResponse.setProvider(baseResponse.getProvider());
            enhancedResponse.setRiskLevel(riskLevel);
            enhancedResponse.setModerationAction(guardrailResult.getAction());

            // Step 5: Attach crisis resources for high-risk situations
            if (riskLevel.isHighOrCritical()) {
                String userLanguage = "en"; // TODO: Get from user preferences
                String userRegion = "global"; // TODO: Get from user profile or IP geolocation

                List<CrisisResource> resources = safetyService.getCrisisResources(
                    riskLevel,
                    userLanguage,
                    userRegion
                );
                enhancedResponse.setCrisisResources(resources);

                // Add crisis warning if resources are provided
                if (!resources.isEmpty()) {
                    enhancedResponse.setModerationWarning(
                        "If you're in crisis, please reach out to one of these resources for immediate support."
                    );
                }
            }

            // Step 6: Add moderation warning if content was modified
            if (guardrailResult.wasModerated()) {
                String warningMessage = switch (guardrailResult.getAction()) {
                    case BLOCKED -> "For your safety, our original response was replaced with supportive guidance.";
                    case MODIFIED -> "Our response was adjusted to ensure it provides safe and supportive guidance.";
                    case FLAGGED -> "This response has been flagged for review to ensure quality and safety.";
                    default -> null;
                };
                enhancedResponse.setModerationWarning(warningMessage);
            }

            return enhancedResponse;

        } catch (Exception e) {
            log.error("Error in safe AI chat service: {}", e.getMessage(), e);

            // Fallback to safe response
            ChatResponse fallbackResponse = new ChatResponse();
            fallbackResponse.setContent(
                "I'm here to support you, but I'm having technical difficulties right now. " +
                "If you're in crisis, please reach out to a crisis helpline or emergency services immediately."
            );
            fallbackResponse.setCrisisFlagged(false);
            fallbackResponse.setProvider("fallback:error");
            fallbackResponse.setRiskLevel(RiskLevel.NONE);
            fallbackResponse.setModerationAction(ModerationAction.NONE);

            return fallbackResponse;
        }
    }

    @Override
    public boolean isCrisisMessage(String message) {
        // Delegate to base service (backward compatibility)
        // New code should use SafetyClassificationService directly
        return baseChatService.isCrisisMessage(message);
    }
}
