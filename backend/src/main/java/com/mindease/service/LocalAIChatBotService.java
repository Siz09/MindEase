package com.mindease.service;

import com.mindease.config.AIProviderConfig;
import com.mindease.dto.ChatResponse;
import com.mindease.dto.local.LocalAIChatRequest;
import com.mindease.dto.local.LocalAIChatResponse;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "mindease.ai.providers.local.enabled", havingValue = "true")
public class LocalAIChatBotService implements ChatBotService {

    private static final Logger log = LoggerFactory.getLogger(LocalAIChatBotService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private AIProviderConfig aiProviderConfig;

    @Autowired
    private UserRepository userRepository;

    @Override
    public ChatResponse generateResponse(String message, String userId, List<Message> history) {
        return generateResponse(message, userId, history, null);
    }

    @Override
    public ChatResponse generateResponse(String message, String userId, List<Message> history,
            Map<String, String> userContext) {
        try {
            AIProviderConfig.ProviderSettings localProvider = aiProviderConfig.getProviders().get("local");
            if (localProvider == null || localProvider.getUrl() == null) {
                throw new IllegalStateException("Local AI provider not properly configured");
            }
            String serviceUrl = localProvider.getUrl();

            List<LocalAIChatRequest.ConversationMessage> apiHistory = history.stream()
                    .filter(m -> m.getContent() != null && !m.getContent().isBlank())
                    .map(m -> LocalAIChatRequest.ConversationMessage.builder()
                            .role(Boolean.TRUE.equals(m.getIsUserMessage()) ? "user" : "assistant")
                            .content(m.getContent())
                            .build())
                    .collect(Collectors.toList());

            Map<String, Object> profile = buildUserProfile(userId, userContext);

            LocalAIChatRequest request = LocalAIChatRequest.builder()
                    .user_id(userId)
                    .message(message)
                    .profile(profile)
                    .history(apiHistory)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<LocalAIChatRequest> entity = new HttpEntity<>(request, headers);

            log.info("Calling Local AI Service at: {}/chat", serviceUrl);
            ResponseEntity<LocalAIChatResponse> responseEntity = restTemplate.postForEntity(
                    serviceUrl + "/chat", entity, LocalAIChatResponse.class);

            LocalAIChatResponse response = responseEntity.getBody();

            if (response == null || response.getReply() == null) {
                throw new IllegalStateException("Empty response from Local AI Service");
            }

            String finalReply = formatResponseWithCitations(response);
            boolean isCrisis = response.getMeta() != null && "CRISIS".equals(response.getMeta().getSafety());

            if (response.getMeta() != null && response.getMeta().getRisk_score() != null) {
                log.info("Risk score calculated: {}", response.getMeta().getRisk_score());
            }

            return new ChatResponse(finalReply, isCrisis, "local-llama3.2");

        } catch (Exception e) {
            log.error("Local AI Service failed: {}", e.getMessage(), e);
            throw new RuntimeException("Local AI unavailable: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isCrisisMessage(String message) {
        if (message == null) return false;
        String lower = message.toLowerCase();
        return lower.contains("suicide") || lower.contains("kill myself") ||
               lower.contains("want to die") || lower.contains("end it all") ||
               lower.contains("harm myself");
    }

    private Map<String, Object> buildUserProfile(String userId, Map<String, String> userContext) {
        Map<String, Object> profile = new HashMap<>();

        try {
            // Validate UUID format
            UUID uuid;
            try {
                uuid = UUID.fromString(userId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID format for userId");
                return profile;
            }

            Optional<User> userOpt = userRepository.findById(uuid);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getAge() != null)
                    profile.put("age", user.getAge());
                if (user.getGender() != null)
                    profile.put("gender", user.getGender());
                if (user.getCourse() != null)
                    profile.put("course", user.getCourse());
                if (user.getYear() != null)
                    profile.put("year", user.getYear());
                if (user.getCgpa() != null)
                    profile.put("cgpa", user.getCgpa());
                if (user.getMaritalStatus() != null)
                    profile.put("marital_status", user.getMaritalStatus());
            }

            if (userContext != null) {
                // Filter userContext to only allow expected fields to prevent injection
                Set<String> allowedKeys = Set.of("current_mood", "session_context", "recent_activity");
                userContext.entrySet().stream()
                        .filter(e -> allowedKeys.contains(e.getKey()))
                        .forEach(e -> profile.put(e.getKey(), e.getValue()));
            }

        } catch (Exception e) {
            log.warn("Could not build user profile: {}", e.getMessage());
        }

        return profile;
    }

    private String formatResponseWithCitations(LocalAIChatResponse response) {
        StringBuilder formatted = new StringBuilder(response.getReply());

        if (response.getMeta() != null &&
                response.getMeta().getCitations() != null &&
                !response.getMeta().getCitations().isEmpty()) {

            formatted.append("\n\n**📚 References:**");

            for (LocalAIChatResponse.Citation citation : response.getMeta().getCitations()) {
                String title = citation.getTitle() != null ? citation.getTitle() : "Unknown";
                String source = citation.getSource() != null ? citation.getSource() : "Unknown";
                formatted.append("\n- ")
                        .append(title)
                        .append(" (")
                        .append(source)
                        .append(")");
            }
        }

        return formatted.toString();
    }
}
