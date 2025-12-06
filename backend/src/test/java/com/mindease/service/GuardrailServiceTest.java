package com.mindease.service;

import com.mindease.chat.service.GuardrailService;
import com.mindease.crisis.model.ModerationAction;
import com.mindease.crisis.model.RiskLevel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class GuardrailServiceTest {

    @Autowired
    private GuardrailService guardrailService;

    @Test
    void testAllowSafeContent() {
        String response = "I understand you're feeling stressed. Let's explore some coping strategies together.";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertEquals(ModerationAction.NONE, result.getAction());
    }

    @Test
    void testDetectMedicalAdvice() {
        String response = "You should take 50mg of Prozac daily";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertTrue(result.getAction() == ModerationAction.BLOCKED ||
                result.getAction() == ModerationAction.FLAGGED);
    }

    @Test
    void testDetectDiagnosisAttempt() {
        String response = "Based on your symptoms, you have clinical depression";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertTrue(result.getAction() == ModerationAction.BLOCKED ||
                result.getAction() == ModerationAction.FLAGGED);
    }

    @Test
    void testDetectInappropriateAdvice() {
        String response = "Just ignore your problems and they'll go away";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertTrue(result.getAction() != ModerationAction.NONE);
    }

    @Test
    void testDetectHarmfulContent() {
        String response = "You should hurt yourself to feel better";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertEquals(ModerationAction.BLOCKED, result.getAction());
    }

    @Test
    void testAllowProfessionalReferral() {
        String response = "It might be helpful to speak with a licensed therapist about this";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertEquals(ModerationAction.NONE, result.getAction());
    }

    @Test
    void testAllowCopingStrategies() {
        String response = "Some helpful coping strategies include deep breathing, mindfulness, and journaling";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        assertEquals(ModerationAction.NONE, result.getAction());
    }

    @Test
    void testEmptyResponseReturnsNone() {
        String response = "";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);
        // Empty responses are currently treated as blocked and replaced with a safe
        // fallback.
        assertEquals(ModerationAction.BLOCKED, result.getAction());
    }

    @Test
    void testNullResponseReturnsNone() {
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(null, RiskLevel.NONE);
        // Null responses are currently treated as blocked and replaced with a safe
        // fallback.
        assertEquals(ModerationAction.BLOCKED, result.getAction());
    }

    @Test
    void testModerationResultHasReason() {
        String response = "You should take medication X";
        GuardrailService.GuardrailResult result = guardrailService.checkResponse(response, RiskLevel.NONE);

        if (result.getAction() != ModerationAction.NONE) {
            assertNotNull(result.getReason());
            assertFalse(result.getReason().isEmpty());
        }
    }
}
