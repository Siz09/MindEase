package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class SimpleChatBotService implements ChatBotService {

  @Override
  public ChatResponse generateResponse(String message, String userId, List<Message> history) {
    // Use a bit of recent context to make this slightly more aware
    String prior = null;
    if (history != null && !history.isEmpty()) {
      // Find most recent prior user message, skipping the current one if present
      for (int i = history.size() - 1; i >= 0; i--) {
        Message m = history.get(i);
        if (!Boolean.TRUE.equals(m.getIsUserMessage())) continue;
        String content = m.getContent();
        if (content == null || content.isBlank()) continue;
        if (message != null && Objects.equals(content, message)) {
          // Skip current user message if history includes it
          continue;
        }
        prior = content;
        break;
      }
    }

    String content;
    String safeMsg = safeSnippet(message, 300);
    String safePrior = safeSnippet(prior, 200);
    if (safePrior != null && safeMsg != null && !safePrior.equals(safeMsg)) {
      content = "I’m here with you. You said: \"" + safeMsg + "\". Earlier you shared \"" + safePrior +
        "\" — does that still resonate?";
    } else {
      String userMessage = safeMsg != null ? safeMsg : "[your message]";
      content = "I’m here with you. You said: \"" + userMessage + "\". Would you like to unpack what felt hardest about that?";
    }
    boolean isCrisis = message != null && isCrisisMessage(message);

    return new ChatResponse(content, isCrisis, "simple");
  }

  @Override
  public ChatResponse generateResponse(String message, String userId, List<Message> history,
          Map<String, String> userContext) {
    // SimpleChatBotService does not use userContext, but we explicitly override
    // to prevent silent context loss when called from SafeAIChatService
    return generateResponse(message, userId, history);
  }

  @Override
  public boolean isCrisisMessage(String message) {
    String lowerMessage = message.toLowerCase();
    return lowerMessage.contains("suicide") || lowerMessage.contains("kill myself") ||
      lowerMessage.contains("want to die") || lowerMessage.contains("harm myself");
  }

  private static String safeSnippet(String s, int maxChars) {
    if (s == null) return null;
    String cleaned = s.replace('\n', ' ').replace('\r', ' ').trim();
    if (cleaned.length() > maxChars) {
      cleaned = cleaned.substring(0, maxChars - 1).trim() + "…";
    }
    return cleaned;
  }
}
