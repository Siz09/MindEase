package com.mindease.shared.config;

import com.mindease.chat.service.ChatBotService;
import com.mindease.chat.service.OpenAIChatBotService;
import com.mindease.chat.service.SimpleChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for AI provider beans.
 * Supports multiple providers running simultaneously.
 *
 * Providers are enabled/disabled via application.yml:
 * - mindease.ai.providers.openai.enabled
 * - mindease.ai.providers.local.enabled
 *
 * The AIProviderManager handles selection between active providers.
 */
@Configuration
public class ChatBotConfig {

    @Autowired
    private ChatConfig chatConfig;

    /**
     * OpenAI-based ChatBot Service
     * Enabled by default for backward compatibility
     */
    @Bean
    @Qualifier("openAIChatBotService")
    @ConditionalOnProperty(name = "mindease.ai.providers.openai.enabled", havingValue = "true", matchIfMissing = true)
    public ChatBotService openAIChatBotService() {
        return new OpenAIChatBotService();
    }

    /**
     * Simple fallback ChatBot Service
     * Used when no AI providers are available
     */
    @Bean
    @Qualifier("simpleChatBotService")
    @ConditionalOnProperty(name = "chatbot.provider", havingValue = "simple")
    public ChatBotService simpleChatBotService() {
        return new SimpleChatBotService();
    }

    // Note: LocalAIChatBotService bean is defined in its own class with @Service
    // annotation
}
