package com.mindease.service;

import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import com.mindease.model.ModerationAction;
import com.mindease.model.RiskLevel;
import com.mindease.model.User;
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
     * Evicts both session and message caches
     */
    @CacheEvict(value = {"chatSession", "recentMessages"}, key = "#chatSession.user.id")
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
     * Evicts both session and message caches
     */
    @CacheEvict(value = {"chatSession", "recentMessages"}, key = "#chatSession.user.id")
    @Transactional
    public Message saveMessageWithSafety(ChatSession chatSession, String content, boolean isUserMessage,
            RiskLevel riskLevel, ModerationAction moderationAction,
            String moderationReason) {
        // Update session timestamp
        chatSession.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(chatSession);

        // Save message with safety metadata
        Message message = new Message(chatSession, content, isUserMessage);
        message.setIsCrisisFlagged(riskLevel.isHighOrCritical());
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
     * Caches the last N messages for each chat session to reduce DB queries
     */
    @Cacheable(value = "recentMessages", key = "#chatSession.id + '_' + #limit")
    public java.util.List<Message> getRecentMessages(ChatSession chatSession, int limit) {
        java.util.List<Message> allMessages = messageRepository.findByChatSessionOrderByCreatedAtAsc(chatSession);
        int totalMessages = allMessages.size();
        int skipCount = Math.max(0, totalMessages - limit);

        return allMessages.stream()
                .skip(skipCount)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Evict all caches for a specific chat session
     * Useful for admin operations or when session data is modified externally
     */
    @CacheEvict(value = {"chatSession", "recentMessages"}, allEntries = true)
    public void evictAllCaches() {
        // Method intentionally empty - annotation handles cache eviction
    }

    /**
     * Evict caches for a specific user
     */
    @CacheEvict(value = {"chatSession", "recentMessages"}, key = "#userId")
    public void evictUserCaches(java.util.UUID userId) {
        // Method intentionally empty - annotation handles cache eviction
    }
}
