package com.mindease.service;

import com.mindease.config.ChatConfig;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

//@Component // Change from @Service to @Component
public class OpenAIChatBotService implements ChatBotService {

  @Autowired
  private ChatConfig chatConfig;

  @Override
  public String generateResponse(String message, String userId) {
    try {
      OpenAiService service = new OpenAiService(
        chatConfig.getOpenai().getApiKey(),
        Duration.ofSeconds(30)
      );

      // Create a system message that defines the AI's role
      ChatMessage systemMessage = new ChatMessage(
        ChatMessageRole.SYSTEM.value(),
        "You are a compassionate mental health support assistant. " +
          "Provide empathetic, supportive, and helpful responses to users. " +
          "If someone mentions self-harm or suicide, acknowledge their pain, " +
          "express concern, and gently encourage them to seek professional help. " +
          "Keep responses conversational and natural."
      );

      // Create the user message
      ChatMessage userMessage = new ChatMessage(
        ChatMessageRole.USER.value(),
        message
      );

      // Create the completion request
      ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
        .model(chatConfig.getOpenai().getModel())
        .messages(Arrays.asList(systemMessage, userMessage))
        .temperature(chatConfig.getOpenai().getTemperature())
        .maxTokens(chatConfig.getOpenai().getMaxTokens())
        .build();

      // Get the response
      ChatMessage responseMessage = service.createChatCompletion(completionRequest)
        .getChoices().get(0).getMessage();

      return responseMessage.getContent().trim();

    } catch (Exception e) {
      // Fallback response if OpenAI API fails
      return "I'm here to listen and support you. Could you tell me more about what you're experiencing?";
    }
  }

  @Override
  public boolean isCrisisMessage(String message) {
    if (!chatConfig.getCrisisDetection().getEnabled()) {
      return false;
    }

    String lowerMessage = message.toLowerCase();
    List<String> crisisKeywords = chatConfig.getCrisisDetection().getCrisisKeywords();

    return crisisKeywords.stream().anyMatch(lowerMessage::contains);
  }
}
