package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;

import java.util.List;

public interface ChatBotService {
  ChatResponse generateResponse(String message, String userId, List<Message> history);
  boolean isCrisisMessage(String message);
}
