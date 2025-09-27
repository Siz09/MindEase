package com.mindease.service;

import com.mindease.dto.ChatResponse;

public interface ChatBotService {
  ChatResponse generateResponse(String message, String userId);
  boolean isCrisisMessage(String message);
}
