package com.mindease.config;

import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Duration;

@Configuration
public class OpenAIConfig {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${openai.api.timeout:30}")
    private int timeoutSeconds;

    @Bean
    public OpenAiService openAiService() {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            // Return a mock service if no API key is configured
            return null;
        }
        return new OpenAiService(openaiApiKey, Duration.ofSeconds(timeoutSeconds));
    }
}