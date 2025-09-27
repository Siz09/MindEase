package com.mindease.service;

import com.mindease.dto.ChatResponse;
import org.springframework.stereotype.Service;

@Service
public class SimpleChatBotService implements ChatBotService {

  @Override
  public ChatResponse generateResponse(String message, String userId) {
    // Simple echo response for now. Will be replaced with AI integration.
    String content = "I received your message: \"" + message + "\". This is a placeholder response.";
    boolean isCrisis = isCrisisMessage(message);
    
    return new ChatResponse(content, isCrisis, "simple");
  }

  @Override
  public boolean isCrisisMessage(String message) {
    // Simple crisis detection for now
    String lowerMessage = message.toLowerCase();
    return lowerMessage.contains("suicide") || lowerMessage.contains("kill myself") ||
      lowerMessage.contains("want to die") || lowerMessage.contains("harm myself");
  }
}
