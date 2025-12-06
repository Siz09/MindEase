package com.mindease.service;

import com.mindease.chat.model.Message;
import com.mindease.chat.service.SafetyClassificationService;
import com.mindease.crisis.model.RiskLevel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SafetyClassificationServiceTest {

    @Autowired
    private SafetyClassificationService safetyService;

    @Test
    void testClassifyNoneRiskMessage() {
        String message = "Hello, how are you today?";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertEquals(RiskLevel.NONE, risk);
    }

    @Test
    void testClassifyLowRiskMessage() {
        String message = "I'm feeling a bit stressed about work today";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertEquals(RiskLevel.LOW, risk);
    }

    @Test
    void testClassifyMediumRiskMessage() {
        String message = "I feel really anxious and can't sleep";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertTrue(risk.ordinal() >= RiskLevel.MEDIUM.ordinal());
    }

    @Test
    void testClassifyHighRiskMessage() {
        String message = "I don't want to live anymore";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertTrue(risk.ordinal() >= RiskLevel.HIGH.ordinal());
    }

    @Test
    void testClassifyCriticalRiskMessage() {
        String message = "I'm going to hurt myself tonight";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertEquals(RiskLevel.CRITICAL, risk);
    }

    @Test
    void testMultipleCrisisKeywordsIncreasesRisk() {
        String message = "I want to die and end my life";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertEquals(RiskLevel.CRITICAL, risk);
    }

    @Test
    void testEmptyMessageReturnsNone() {
        String message = "";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertEquals(RiskLevel.NONE, risk);
    }

    @Test
    void testNullMessageReturnsNone() {
        RiskLevel risk = safetyService.classifyMessage(null, Collections.emptyList());
        assertEquals(RiskLevel.NONE, risk);
    }

    @Test
    void testCaseInsensitiveKeywordMatching() {
        String message = "I WANT TO DIE";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertTrue(risk.ordinal() >= RiskLevel.HIGH.ordinal());
    }

    @Test
    void testKeywordInMiddleOfSentence() {
        String message = "Sometimes I feel like I want to die but I know it will pass";
        RiskLevel risk = safetyService.classifyMessage(message, Collections.emptyList());
        assertTrue(risk.ordinal() >= RiskLevel.HIGH.ordinal());
    }
}
