package com.mindease.service;

import com.mindease.config.ChatConfig;
import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@Qualifier("openAIChatBotService")
public class OpenAIChatBotService implements ChatBotService {

    @Autowired
    private ChatConfig chatConfig;

    private static final Logger log = LoggerFactory.getLogger(OpenAIChatBotService.class);

    @Override
    public ChatResponse generateResponse(String message, String userId, List<Message> history) {
        return generateResponse(message, userId, history, null);
    }

    @Override
    public ChatResponse generateResponse(String message, String userId, List<Message> history,
            java.util.Map<String, String> userContext) {
        try {
            OpenAiService service = getOrCreateService();
            if (service == null) {
                log.warn("OpenAI API key missing (chat.openai.api-key); returning fallback response");
                String fallbackContent = "I'm here to listen and support you. Could you tell me more about what you're experiencing?";
                boolean isCrisis = isCrisisMessage(message);
                return new ChatResponse(fallbackContent, isCrisis, "fallback:no_api_key");
            }

            // Build context string
            StringBuilder contextBuilder = new StringBuilder();
            if (userContext != null && !userContext.isEmpty()) {
                contextBuilder.append("\nUser Context:\n");
                // Sanitize userContext to prevent PII leakage to third-party OpenAI service
                // Only include non-sensitive context fields - filter out emails, identifiers,
                // and personal data
                java.util.Set<String> sensitiveKeys = java.util.Set.of("email", "userId", "user_id", "id", "phone",
                        "phoneNumber", "ssn", "address", "personalInfo", "pii");
                userContext.entrySet().stream()
                        .filter(entry -> entry.getKey() != null && entry.getValue() != null
                                && !sensitiveKeys.contains(entry.getKey().toLowerCase()))
                        .forEach(entry -> contextBuilder.append("- ").append(entry.getKey()).append(": ")
                                .append(entry.getValue()).append("\n"));
            }

            // Persona + safety-first system prompt derived from your spec
            String persona = String.join("\n",
                    "You are Mindease — a compassionate, emotionally intelligent mental health companion.",
                    "You are not a therapist or medical professional. Do not diagnose or give medical advice.",
                    "Goals: help users explore emotions, validate feelings, gently guide reflection and resilience, and ensure safety.",
                    "Tone: Calm • Warm • Empathetic • Respectful • Grounded.",
                    "Behavioral rules:",
                    "- Empathy first: respond to the emotion, not just the content.",
                    "- Ask before going deeper; never pressure.",
                    "- Short to medium, conversational responses (avoid long monologues).",
                    "- Use grounding or reflection when overwhelmed; be hope-oriented.",
                    "- If crisis indicators appear, acknowledge pain and encourage immediate human help.",
                    "Response format: 1) Acknowledge emotion 2) One reflective/grounding prompt 3) Encouraging close.")
                    + contextBuilder.toString();

            String behaviorTag = mapBehaviorTag(message);
            boolean crisis = isCrisisMessage(message);

            ChatMessage systemPersona = new ChatMessage(ChatMessageRole.SYSTEM.value(), persona);
            ChatMessage systemBehavior = new ChatMessage(
                    ChatMessageRole.SYSTEM.value(),
                    "Behavior tags: " + behaviorTag + (crisis ? " [safety-check]" : ""));

            // Build conversation: system → prior history → latest user
            List<ChatMessage> msgs = new ArrayList<>();
            msgs.add(systemPersona);
            msgs.add(systemBehavior);

            // Bound history size to reduce token usage
            int maxHistorySize = 20;
            List<Message> boundedHistory = history == null ? java.util.Collections.emptyList()
                    : (history.size() > maxHistorySize
                            ? history.subList(history.size() - maxHistorySize, history.size())
                            : history);

            boolean hasCurrentAlready = false;
            if (boundedHistory != null) {
                // Check if the last user message in history equals the current message
                for (int i = boundedHistory.size() - 1; i >= 0; i--) {
                    Message m = boundedHistory.get(i);
                    if (Boolean.TRUE.equals(m.getIsUserMessage())) {
                        if (m.getContent() != null && m.getContent().equals(message)) {
                            hasCurrentAlready = true;
                        }
                        break;
                    }
                }
                for (Message m : boundedHistory) {
                    String role = Boolean.TRUE.equals(m.getIsUserMessage()) ? ChatMessageRole.USER.value()
                            : ChatMessageRole.ASSISTANT.value();
                    if (m.getContent() == null || m.getContent().isBlank())
                        continue;
                    msgs.add(new ChatMessage(role, m.getContent()));
                }
            }

            // Append the current user turn explicitly at the end only if not already
            // present
            if (!hasCurrentAlready) {
                msgs.add(new ChatMessage(ChatMessageRole.USER.value(), message));
            }

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(chatConfig.getOpenai().getModel())
                    .messages(msgs)
                    .temperature(chatConfig.getOpenai().getTemperature())
                    .topP(0.9)
                    .maxTokens(chatConfig.getOpenai().getMaxTokens())
                    .build();

            var completion = service.createChatCompletion(completionRequest);
            if (completion.getChoices() == null || completion.getChoices().isEmpty()) {
                throw new IllegalStateException("OpenAI returned no choices");
            }
            ChatMessage responseMessage = completion.getChoices().get(0).getMessage();

            String content = responseMessage.getContent() != null ? responseMessage.getContent().trim() : "";
            boolean isCrisis = crisis;

            return new ChatResponse(content, isCrisis, "openai:mindease");

        } catch (Exception e) {
            log.error("OpenAI chat completion failed: {}", e.getMessage(), e);
            String fallbackContent = "I'm here to listen and support you. Could you tell me more about what you're experiencing?";
            boolean isCrisis = isCrisisMessage(message);
            return new ChatResponse(fallbackContent, isCrisis, "fallback:error");
        }
    }

    private OpenAiService openAiService;

    private synchronized OpenAiService getOrCreateService() {
        if (openAiService != null)
            return openAiService;
        String apiKey = chatConfig.getOpenai().getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }
        openAiService = new OpenAiService(apiKey, Duration.ofSeconds(30));
        return openAiService;
    }

    @Override
    public boolean isCrisisMessage(String message) {
        if (chatConfig.getCrisisDetection() == null) {
            return false;
        }
        if (!chatConfig.getCrisisDetection().getEnabled()) {
            return false;
        }
        String lowerMessage = message == null ? "" : message.toLowerCase(Locale.ROOT);
        List<String> crisisKeywords = chatConfig.getCrisisDetection().getCrisisKeywords();
        if (crisisKeywords == null) {
            return false;
        }
        return crisisKeywords.stream().anyMatch(lowerMessage::contains);
    }

    private String mapBehaviorTag(String message) {
        String m = message == null ? "" : message.toLowerCase(Locale.ROOT);
        if (m.contains("overwhelm") || m.contains("panic") || m.contains("anxi") || m.contains("stres"))
            return "[grounding][reflective]";
        if (m.contains("sad") || m.contains("lonely") || m.contains("alone") || m.contains("hopeless")
                || m.contains("empty"))
            return "[empathetic][supportive]";
        if (m.contains("angry") || m.contains("mad") || m.contains("frustrat") || m.contains("irritat"))
            return "[reflective][encouraging]";
        if (m.contains("numb") || m.contains("pointless") || m.contains("don't care"))
            return "[empathetic][encouraging]";
        if (m.contains("good") || m.contains("better") || m.contains("grateful") || m.contains("happy"))
            return "[encouraging][reflective]";
        return "[empathetic]";
    }
}
