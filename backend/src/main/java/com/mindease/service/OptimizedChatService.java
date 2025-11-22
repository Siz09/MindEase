package com.mindease.service;

import com.mindease.model.*;
import com.mindease.repository.ChatSessionRepository;
import com.mindease.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class OptimizedChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    /**
     * Get or create chat session with optimized query
     */
    @Cacheable(value = "chatSession", key = "#user.id")
    public ChatSession getOrCreateChatSession(User user) {
        return chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    ChatSession newSession = new ChatSession(user);
                    return chatSessionRepository.save(newSession);
                });
    }

    /**
     * Save message and update session timestamp
     */
    @CacheEvict(value = "chatSession", key = "#chatSession.user.id")
    @Transactional
    public Message saveMessage(ChatSession chatSession, String content, boolean isUserMessage,
            boolean isCrisisFlagged) {
        // Update session timestamp
        chatSession.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(chatSession);

        // Save message
        Message message = new Message(chatSession, content, isUserMessage);
        message.setIsCrisisFlagged(isCrisisFlagged);
        return messageRepository.save(message);
    }

    /**
     * Save message with full safety metadata
     */
    @CacheEvict(value = "chatSession", key = "#chatSession.user.id")
    @Transactional
    public Message saveMessageWithSafety(ChatSession chatSession, String content, boolean isUserMessage,
            RiskLevel riskLevel, ModerationAction moderationAction,
            String moderationReason) {
        // Update session timestamp
        chatSession.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(chatSession);

        // Save message with safety metadata
        Message message = new Message(chatSession, content, isUserMessage);
        message.setIsCrisisFlagged(riskLevel.ordinal() >= RiskLevel.HIGH.ordinal());
        message.setRiskLevel(riskLevel);
        message.setSafetyChecked(true);
        message.setModerationAction(moderationAction);
        message.setModerationReason(moderationReason);

        return messageRepository.save(message);
    }

    /**
     * Get chat history with pagination
     */
    public Page<Message> getChatHistory(ChatSession chatSession, Pageable pageable) {
        return messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable);
    }

    /**
     * Get recent messages for context (cached)
     */
    @Cacheable(value = "recentMessages", key = "#chatSession.id")
    public java.util.List<Message> getRecentMessages(ChatSession chatSession, int limit) {
        return messageRepository.findByChatSessionOrderByCreatedAtAsc(chatSession)
                .stream()
                .skip(Math.max(0, messageRepository.findByChatSessionOrderByCreatedAtAsc(chatSession).size() - limit))
                .collect(java.util.stream.Collectors.toList());
    }
}
