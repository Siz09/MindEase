package com.mindease.config;

import com.theokanning.openai.service.OpenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OpenAIConfig {

    private static final Logger log = LoggerFactory.getLogger(OpenAIConfig.class);

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    // Fallback to chat key if openai.api.key is missing
    @Value("${chat.openai.api-key:}")
    private String chatOpenaiApiKey;

    @Value("${openai.api.timeout:30}")
    private int timeoutSeconds;

    @Bean
    public OpenAiService openAiService() {
        String key = (openaiApiKey != null && !openaiApiKey.trim().isEmpty())
                ? openaiApiKey.trim()
                : (chatOpenaiApiKey != null ? chatOpenaiApiKey.trim() : null);

        if (key == null || key.trim().isEmpty()) {
            throw new IllegalStateException(
                    "OpenAI API key not configured. Please set either openai.api.key or chat.openai.api-key");
        }

        log.info("Configuring OpenAI client (timeout={}s)", timeoutSeconds);
        return new OpenAiService(key, Duration.ofSeconds(timeoutSeconds));
    }
}
