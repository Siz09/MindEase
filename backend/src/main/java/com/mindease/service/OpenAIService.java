package com.mindease.service;

import com.theokanning.openai.service.OpenAiService;
import com.theokanning.openai.completion.CompletionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class OpenAIService {

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);

    @Autowired(required = false)
    private OpenAiService openAiService;

    @Value("${openai.model:gpt-3.5-turbo-instruct}")
    private String model;

    @Value("${openai.max-tokens:150}")
    private int maxTokens;

    @Value("${openai.temperature:0.7}")
    private double temperature;

    public Optional<String> generateJournalSummary(String journalContent) {
        if (openAiService == null) {
            logger.warn("OpenAI service not configured - returning mock summary");
            return generateMockSummary(journalContent);
        }

        try {
            String prompt = createJournalSummaryPrompt(journalContent);
            
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .model(model)
                    .prompt(prompt)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            var completionResult = openAiService.createCompletion(completionRequest);
            var choices = completionResult.getChoices();
            
            if (choices != null && !choices.isEmpty()) {
                String summary = choices.get(0).getText().trim();
                logger.info("Successfully generated AI summary for journal entry");
                return Optional.of(summary);
            } else {
                logger.warn("No choices returned from OpenAI API");
                return generateMockSummary(journalContent);
            }

        } catch (Exception e) {
            logger.error("Error calling OpenAI API: {}", e.getMessage(), e);
            return generateMockSummary(journalContent);
        }
    }

    public Optional<String> generateMoodInsight(String journalContent) {
        if (openAiService == null) {
            logger.warn("OpenAI service not configured - returning mock mood insight");
            return generateMockMoodInsight(journalContent);
        }

        try {
            String prompt = createMoodInsightPrompt(journalContent);
            
            CompletionRequest completionRequest = CompletionRequest.builder()
                    .model(model)
                    .prompt(prompt)
                    .maxTokens(100)
                    .temperature(0.5)
                    .build();

            var completionResult = openAiService.createCompletion(completionRequest);
            var choices = completionResult.getChoices();
            
            if (choices != null && !choices.isEmpty()) {
                String insight = choices.get(0).getText().trim();
                logger.info("Successfully generated mood insight for journal entry");
                return Optional.of(insight);
            } else {
                logger.warn("No choices returned from OpenAI API for mood insight");
                return generateMockMoodInsight(journalContent);
            }

        } catch (Exception e) {
            logger.error("Error calling OpenAI API for mood insight: {}", e.getMessage(), e);
            return generateMockMoodInsight(journalContent);
        }
    }

    private String createJournalSummaryPrompt(String journalContent) {
        return "Please provide a concise, empathetic summary of this journal entry from a mental health perspective. " +
               "Focus on the main emotions and themes. Keep it under 100 words.\n\n" +
               "Journal entry: " + journalContent + "\n\n" +
               "Summary:";
    }

    private String createMoodInsightPrompt(String journalContent) {
        return "Based on this journal entry, provide a brief insight about the writer's emotional state and one gentle suggestion for self-care. Keep it under 50 words.\n\n" +
               "Journal entry: " + journalContent + "\n\n" +
               "Insight:";
    }

    private Optional<String> generateMockSummary(String journalContent) {
        // Fallback mock summary for when OpenAI is not configured
        String mockSummary = "This entry discusses personal reflections and emotional experiences. " +
                           "The writer appears to be processing their thoughts and feelings in a constructive way.";
        return Optional.of(mockSummary);
    }

    private Optional<String> generateMockMoodInsight(String journalContent) {
        // Fallback mock mood insight
        String mockInsight = "You're taking positive steps by reflecting on your experiences. " +
                           "Consider taking a moment for deep breathing to center yourself.";
        return Optional.of(mockInsight);
    }

    public boolean isOpenAIConfigured() {
        return openAiService != null;
    }
}