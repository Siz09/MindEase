package com.mindease.service;

import org.springframework.stereotype.Service;

@Service
public class SimpleChatBotService implements ChatBotService {

  @Override
  public String generateResponse(String message, String userId) {
    // Simple echo response for now. Will be replaced with AI integration.
    return "I received your message: \"" + message + "\". This is a placeholder response.";
  }

  @Override
  public boolean isCrisisMessage(String message) {
    // Simple crisis detection for now
    String lowerMessage = message.toLowerCase();
    return lowerMessage.contains("suicide") || lowerMessage.contains("kill myself") ||
      lowerMessage.contains("want to die") || lowerMessage.contains("harm myself");
  }
}
