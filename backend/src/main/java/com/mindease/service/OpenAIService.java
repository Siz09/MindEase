package com.mindease.service;

import com.mindease.config.AIPromptConfig;
import com.mindease.config.ChatConfig;
import com.theokanning.openai.completion.chat.ChatCompletionChoice;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.OpenAiHttpException;
import com.theokanning.openai.service.OpenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OpenAIService {

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);

    @Autowired
    private ChatConfig chatConfig;

    @Autowired
    private AIPromptConfig aiPromptConfig;

    // Lazily initialize our own OpenAI client using the same mechanism as chat
    private volatile OpenAiService client;

    @Value("${openai.model:}")
    private String legacyModel; // optional override; otherwise use chat config

    public Optional<String> generateJournalSummary(String journalContent) {
        OpenAiService svc = getOrCreateService();
        if (svc == null) {
            logger.error("OpenAI service not configured - API key missing or invalid. Returning mock summary.");
            return generateMockSummary(journalContent);
        }

        try {
            String resolvedModel = resolveChatModel(effectiveModel());
            var openaiConfig = chatConfig.getOpenai();
            if (openaiConfig == null) {
                logger.error("OpenAI configuration missing - chat.openai configuration not found. Returning mock summary.");
                return generateMockSummary(journalContent);
            }

            List<ChatMessage> messages = new ArrayList<>();
            String systemPrompt = aiPromptConfig.getJournalSummarySystem() != null
                    ? aiPromptConfig.getJournalSummarySystem()
                    : "You are an empathetic mental health assistant. Provide concise, supportive summaries.";
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(),
                    createJournalSummaryPrompt(journalContent)));

            ChatCompletionRequest req = ChatCompletionRequest.builder()
                    .model(resolvedModel)
                    .messages(messages)
                    .temperature(openaiConfig.getTemperature())
                    .topP(0.9)
                    .maxTokens(openaiConfig.getMaxTokens())
                    .build();

            var result = svc.createChatCompletion(req);
            List<ChatCompletionChoice> choices = result.getChoices();
            if (choices != null && !choices.isEmpty() && choices.get(0).getMessage() != null) {
                String summary = choices.get(0).getMessage().getContent();
                if (summary != null)
                    summary = summary.trim();
                logger.info("Successfully generated AI summary for journal entry");
                return Optional.ofNullable(summary);
            }
            logger.warn("No choices returned from OpenAI Chat API for summary");
            return generateMockSummary(journalContent);

        } catch (OpenAiHttpException e) {
            // Distinguish between configuration errors (401, 403) and temporary failures
            if (e.statusCode == 401 || e.statusCode == 403) {
                logger.error("OpenAI API authentication failed (status: {}). Check API key configuration. Returning mock summary.", e.statusCode, e);
            } else {
                logger.warn("Temporary error calling OpenAI Chat API (summary, status: {}): {}. Returning mock summary.", e.statusCode, e.getMessage());
            }
            return generateMockSummary(journalContent);
        } catch (Exception e) {
            logger.warn("Unexpected error calling OpenAI Chat API (summary): {}. Returning mock summary.", e.getMessage(), e);
            return generateMockSummary(journalContent);
        }
    }

    public Optional<String> generateMoodInsight(String journalContent) {
        OpenAiService svc = getOrCreateService();
        if (svc == null) {
            logger.error("OpenAI service not configured - API key missing or invalid. Returning mock mood insight.");
            return generateMockMoodInsight(journalContent);
        }

        try {
            String resolvedModel = resolveChatModel(effectiveModel());
            var openaiConfig = chatConfig.getOpenai();
            if (openaiConfig == null) {
                logger.error("OpenAI configuration missing - chat.openai configuration not found. Returning mock insight.");
                return generateMockMoodInsight(journalContent);
            }

            List<ChatMessage> messages = new ArrayList<>();
            String systemPrompt = aiPromptConfig.getMoodInsightSystem() != null
                    ? aiPromptConfig.getMoodInsightSystem()
                    : "You analyze journal entries to detect emotions and suggest one gentle self-care tip.";
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(),
                    createMoodInsightPrompt(journalContent)));

            ChatCompletionRequest req = ChatCompletionRequest.builder()
                    .model(resolvedModel)
                    .messages(messages)
                    .temperature(openaiConfig.getTemperature())
                    .topP(0.9)
                    .maxTokens(Math.min(openaiConfig.getMaxTokens(), 120))
                    .build();

            var result = svc.createChatCompletion(req);
            List<ChatCompletionChoice> choices = result.getChoices();
            if (choices != null && !choices.isEmpty() && choices.get(0).getMessage() != null) {
                String insight = choices.get(0).getMessage().getContent();
                if (insight != null)
                    insight = insight.trim();
                logger.info("Successfully generated mood insight for journal entry");
                return Optional.ofNullable(insight);
            }
            logger.warn("No choices returned from OpenAI Chat API for mood insight");
            return generateMockMoodInsight(journalContent);

        } catch (OpenAiHttpException e) {
            // Distinguish between configuration errors (401, 403) and temporary failures
            if (e.statusCode == 401 || e.statusCode == 403) {
                logger.error("OpenAI API authentication failed (status: {}). Check API key configuration. Returning mock insight.", e.statusCode, e);
            } else {
                logger.warn("Temporary error calling OpenAI Chat API (insight, status: {}): {}. Returning mock insight.", e.statusCode, e.getMessage());
            }
            return generateMockMoodInsight(journalContent);
        } catch (Exception e) {
            logger.warn("Unexpected error calling OpenAI Chat API (insight): {}. Returning mock insight.", e.getMessage(), e);
            return generateMockMoodInsight(journalContent);
        }
    }

    private String createJournalSummaryPrompt(String journalContent) {
        String template = aiPromptConfig.getJournalSummary() != null
                ? aiPromptConfig.getJournalSummary()
                : "Summarize the following journal entry in under 100 words, with empathy and focus on emotions and themes.\n\nJournal entry: {content}";
        return template.replace("{content}", journalContent);
    }

    private String createMoodInsightPrompt(String journalContent) {
        String template = aiPromptConfig.getMoodInsight() != null
                ? aiPromptConfig.getMoodInsight()
                : "Based on this journal entry, briefly describe the writer's emotional state and offer one gentle self-care suggestion (under 50 words).\n\nJournal entry: {content}";
        return template.replace("{content}", journalContent);
    }

    private Optional<String> generateMockSummary(String journalContent) {
        String mockSummary = "This entry discusses personal reflections and emotional experiences. "
                + "The writer appears to be processing their thoughts and feelings in a constructive way.";
        return Optional.of(mockSummary);
    }

    private Optional<String> generateMockMoodInsight(String journalContent) {
        String mockInsight = "You're taking positive steps by reflecting on your experiences. "
                + "Consider taking a moment for deep breathing to center yourself.";
        return Optional.of(mockInsight);
    }

    public boolean isOpenAIConfigured() {
        return getOrCreateService() != null;
    }

    private String resolveChatModel(String configured) {
        if (configured == null || configured.isBlank())
            return "gpt-3.5-turbo";
        // If an instruct model is configured, switch to nearest chat model.
        String lower = configured.toLowerCase();
        if (lower.contains("instruct"))
            return "gpt-3.5-turbo";
        return configured;
    }

    private String effectiveModel() {
        // Prefer chat config model; fall back to legacy openai.model if provided
        try {
            String m = chatConfig.getOpenai().getModel();
            if (m != null && !m.isBlank())
                return m;
        } catch (Exception e) {
            logger.debug("Could not retrieve model from chat config, using legacy: {}", e.getMessage());
        }
        return legacyModel;
    }

    private OpenAiService getOrCreateService() {
        if (client != null)
            return client;
        synchronized (this) {
            if (client != null)
                return client;
            String apiKey = null;
            try {
                var openaiCfg = chatConfig.getOpenai();
                if (openaiCfg != null) {
                    apiKey = openaiCfg.getApiKey();
                }
            } catch (Exception ignored) {
                // chat config not available
            }
            if (apiKey == null || apiKey.isBlank()) {
                logger.warn("OpenAI API key not found via chat config (chat.openai.api-key)");
                return null;
            }
            client = new OpenAiService(apiKey, Duration.ofSeconds(30));
            return client;
        }
    }
}
