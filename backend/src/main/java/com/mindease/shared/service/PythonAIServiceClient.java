package com.mindease.shared.service;

import com.mindease.chat.dto.ChatResponse;
import com.mindease.chat.model.Message;
import com.mindease.crisis.model.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Client for calling Python AI service.
 * Replaces direct OpenAI API calls in Java services.
 */
@Service
public class PythonAIServiceClient {

    private static final Logger log = LoggerFactory.getLogger(PythonAIServiceClient.class);

    private final RestTemplate restTemplate;
    private final String pythonServiceUrl;

    public PythonAIServiceClient(
            RestTemplate restTemplate,
            @Value("${python.ai.service.url:http://localhost:8000}") String pythonServiceUrl) {
        this.restTemplate = restTemplate;
        this.pythonServiceUrl = pythonServiceUrl;
        log.info("PythonAIServiceClient initialized with URL: {}", pythonServiceUrl);
    }

    /**
     * Generate chat response using Python AI service.
     * Replaces OpenAIChatBotService.generateResponse() OpenAI calls.
     */
    public ChatResponse generateChatResponse(
            String message,
            String userId,
            List<Message> history,
            Map<String, String> userContext) {
        try {
            String url = pythonServiceUrl + "/chat/generate";

            // Convert Java Message entities to Python service format
            List<Map<String, Object>> historyList = history != null
                    ? history.stream()
                            .map(m -> {
                                Map<String, Object> msg = new HashMap<>();
                                msg.put("content", m.getContent());
                                msg.put("is_user_message", Boolean.TRUE.equals(m.getIsUserMessage()));
                                return msg;
                            })
                            .toList()
                    : List.of();

            Map<String, Object> request = new HashMap<>();
            request.put("message", message);
            request.put("user_id", userId);
            request.put("history", historyList);
            if (userContext != null) {
                request.put("user_context", userContext);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.debug("Calling Python AI service at: {}", url);
            ResponseEntity<ChatResponse> response = restTemplate.postForEntity(
                    url, entity, ChatResponse.class);

            ChatResponse chatResponse = response.getBody();
            if (chatResponse == null) {
                throw new IllegalStateException("Empty response from Python AI service");
            }

            // Ensure timestamp is set
            if (chatResponse.getTimestamp() == null) {
                chatResponse.setTimestamp(LocalDateTime.now());
            }

            log.debug("Python AI service returned response with provider: {}", chatResponse.getProvider());
            return chatResponse;

        } catch (RestClientException e) {
            log.error("Failed to call Python AI service: {}", e.getMessage(), e);
            throw new RuntimeException("Python AI service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Generate journal summary using Python AI service.
     * Replaces OpenAIService.generateJournalSummary().
     */
    public Optional<String> generateJournalSummary(String journalContent) {
        try {
            String url = pythonServiceUrl + "/journal/summary";

            Map<String, String> request = new HashMap<>();
            request.put("content", journalContent);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, String>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, String>>() {
                    });

            Map<String, String> body = response.getBody();
            if (body != null && body.containsKey("summary")) {
                return Optional.ofNullable(body.get("summary"));
            }

            return Optional.empty();

        } catch (RestClientException e) {
            log.warn("Failed to call Python AI service for journal summary: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Generate mood insight using Python AI service.
     * Replaces OpenAIService.generateMoodInsight().
     */
    public Optional<String> generateMoodInsight(String journalContent) {
        try {
            String url = pythonServiceUrl + "/journal/mood-insight";

            Map<String, String> request = new HashMap<>();
            request.put("content", journalContent);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, String>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, String>>() {
                    });

            Map<String, String> body = response.getBody();
            if (body != null && body.containsKey("insight")) {
                return Optional.ofNullable(body.get("insight"));
            }

            return Optional.empty();

        } catch (RestClientException e) {
            log.warn("Failed to call Python AI service for mood insight: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Classify message safety using Python AI service.
     * Replaces SafetyClassificationService.classifyMessage().
     */
    public RiskLevel classifySafety(String content, List<Message> recentHistory) {
        try {
            String url = pythonServiceUrl + "/safety/classify";

            // Convert history to Python service format
            List<Map<String, Object>> historyList = recentHistory != null
                    ? recentHistory.stream()
                            .map(m -> {
                                Map<String, Object> msg = new HashMap<>();
                                msg.put("content", m.getContent());
                                msg.put("is_user_message", Boolean.TRUE.equals(m.getIsUserMessage()));
                                return msg;
                            })
                            .toList()
                    : List.of();

            Map<String, Object> request = new HashMap<>();
            request.put("content", content);
            request.put("recent_history", historyList);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("risk_level")) {
                String riskLevelStr = (String) body.get("risk_level");
                try {
                    return RiskLevel.valueOf(riskLevelStr);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid risk level from Python service: {}", riskLevelStr);
                    return RiskLevel.NONE;
                }
            }

            return RiskLevel.NONE;

        } catch (RestClientException e) {
            log.warn("Failed to call Python AI service for safety classification: {}", e.getMessage());
            // Fallback to NONE if service unavailable
            return RiskLevel.NONE;
        }
    }
}
