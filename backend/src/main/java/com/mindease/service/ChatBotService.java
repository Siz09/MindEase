package com.mindease.service;

import com.mindease.dto.ChatResponse;
import com.mindease.model.Message;

import java.util.List;

import java.util.Map;

public interface ChatBotService {
    ChatResponse generateResponse(String message, String userId, List<Message> history);

    default ChatResponse generateResponse(String message, String userId, List<Message> history,
            Map<String, String> userContext) {
        return generateResponse(message, userId, history);
    }

    boolean isCrisisMessage(String message);
}
