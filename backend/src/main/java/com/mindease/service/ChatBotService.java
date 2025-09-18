package com.mindease.service;

public interface ChatBotService {
  String generateResponse(String message, String userId);
  boolean isCrisisMessage(String message);
}
