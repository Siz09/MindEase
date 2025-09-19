package com.mindease.config;

import com.mindease.service.ChatBotService;
import com.mindease.service.OpenAIChatBotService;
import com.mindease.service.SimpleChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class ChatBotConfig {

  @Autowired
  private ChatConfig chatConfig;

  @Bean
  @Primary // Add @Primary here
  @ConditionalOnProperty(name = "chatbot.provider", havingValue = "openai", matchIfMissing = true)
  public ChatBotService openAIChatBotService() {
    return new OpenAIChatBotService();
  }

  @Bean
  @ConditionalOnProperty(name = "chatbot.provider", havingValue = "simple")
  public ChatBotService simpleChatBotService() {
    return new SimpleChatBotService();
  }
}
