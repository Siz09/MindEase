package com.mindease.chat.service;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.chat.dto.ChatResponse;
import com.mindease.chat.dto.local.LocalAIChatRequest;
import com.mindease.chat.dto.local.LocalAIChatResponse;
import com.mindease.chat.model.Message;
import com.mindease.shared.config.AIProviderConfig;
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

            // Log profile contents for debugging (excluding sensitive data)
            if (log.isDebugEnabled()) {
                log.debug("User profile built for userId: {}, contains {} fields", userId, profile.size());
                if (profile.containsKey("days_indoors") || profile.containsKey("changes_habits") ||
                        profile.containsKey("work_interest") || profile.containsKey("social_weakness")) {
                    log.info("Enhanced AI model will be used - behavioral data present in profile");
                } else {
                    log.info("Falling back to basic model - no behavioral data in profile");
                }
            }

            LocalAIChatRequest request = LocalAIChatRequest.builder()
                    .user_id(userId)
                    .message(message)
                    .profile(profile)
                    .history(apiHistory)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<LocalAIChatRequest> entity = new HttpEntity<>(request, headers);

            log.info("Calling Local AI Service at: {}/chat with profile containing {} fields", serviceUrl,
                    profile.size());
            if (log.isDebugEnabled()) {
                log.debug("Request profile keys: {}", profile.keySet());
            }

            long startTime = System.currentTimeMillis();
            ResponseEntity<LocalAIChatResponse> responseEntity;
            try {
                responseEntity = restTemplate.postForEntity(
                        serviceUrl + "/chat", entity, LocalAIChatResponse.class);
                long duration = System.currentTimeMillis() - startTime;
                log.info("Local AI Service responded in {}ms", duration);
            } catch (org.springframework.web.client.ResourceAccessException e) {
                long duration = System.currentTimeMillis() - startTime;
                log.error("Local AI Service timeout after {}ms. Is the service running at {}? Error: {}",
                        duration, serviceUrl, e.getMessage());
                throw e;
            }

            LocalAIChatResponse response = responseEntity.getBody();

            if (response == null || response.getReply() == null) {
                throw new IllegalStateException("Empty response from Local AI Service");
            }

            // Use the reply directly without citations for cleaner chat experience
            String finalReply = response.getReply();
            boolean isCrisis = response.getMeta() != null && "CRISIS".equals(response.getMeta().getSafety());

            if (response.getMeta() != null && response.getMeta().getRisk_score() != null) {
                log.info("Risk score calculated: {}", response.getMeta().getRisk_score());
            }

            // Provider identifier: "local-llama3.2" indicates Local AI is being used
            return new ChatResponse(finalReply, isCrisis, "local-llama3.2");

        } catch (Exception e) {
            log.error("Local AI Service failed: {}", e.getMessage(), e);
            throw new RuntimeException("Local AI unavailable: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isCrisisMessage(String message) {
        if (message == null)
            return false;
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
                // Basic demographic fields (used by old model)
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

                // New behavioral fields for enhanced Random Forest model (98% accuracy)
                if (user.getDaysIndoors() != null)
                    profile.put("days_indoors", user.getDaysIndoors());
                if (user.getChangesHabits() != null)
                    profile.put("changes_habits", user.getChangesHabits());
                if (user.getWorkInterest() != null)
                    profile.put("work_interest", user.getWorkInterest());
                if (user.getSocialWeakness() != null)
                    profile.put("social_weakness", user.getSocialWeakness());
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
