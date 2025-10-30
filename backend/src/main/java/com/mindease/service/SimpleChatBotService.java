package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SimpleChatBotService implements ChatBotService {

  @Override
  public ChatResponse generateResponse(String message, String userId, List<Message> history) {
    // Use a bit of recent context to make this slightly more aware
    String prior = null;
    if (history != null && !history.isEmpty()) {
      // find most recent user message before the current one
      for (int i = history.size() - 1; i >= 0; i--) {
        Message m = history.get(i);
        if (Boolean.TRUE.equals(m.getIsUserMessage())) {
          prior = m.getContent();
          break;
        }
      }
    }

    String content;
    if (prior != null && !prior.isBlank() && (message == null || !prior.equals(message))) {
      content = "I’m here with you. You said: \"" + message + "\". Earlier you shared \"" + prior +
        "\" — does that still resonate?";
    } else {
      content = "I’m here with you. You said: \"" + message + "\". Would you like to unpack what felt hardest about that?";
    }
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
