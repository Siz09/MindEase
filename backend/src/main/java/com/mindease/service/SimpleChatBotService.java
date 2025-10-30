package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SimpleChatBotService implements ChatBotService {

  @Override
  public ChatResponse generateResponse(String message, String userId, List<Message> history) {
    String content = "I’m here with you. You said: \"" + message + "\". " +
      "Would you like to unpack what felt hardest about that?";
    boolean isCrisis = isCrisisMessage(message);

    return new ChatResponse(content, isCrisis, "simple");
  }

  @Override
  public boolean isCrisisMessage(String message) {
    String lowerMessage = message.toLowerCase();
    return lowerMessage.contains("suicide") || lowerMessage.contains("kill myself") ||
      lowerMessage.contains("want to die") || lowerMessage.contains("harm myself");
  }
}
