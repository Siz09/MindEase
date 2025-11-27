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
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;

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
    @Caching(evict = {
            @CacheEvict(value = "chatSession", key = "#chatSession.user.id"),
            @CacheEvict(value = "recentMessages", allEntries = true)
    })
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
    @Caching(evict = {
            @CacheEvict(value = "chatSession", key = "#chatSession.user.id"),
            @CacheEvict(value = "recentMessages", allEntries = true)
    })
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
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, limit,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,
                        "createdAt"));
        java.util.List<Message> messages = new ArrayList<>(
                messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable).getContent());
        Collections.reverse(messages); // Return in ascending order
        return messages;
    }

    /**
     * Evict all cache entries across all users and sessions
     * Useful for admin operations or after bulk data modifications
     */
    @CacheEvict(value = { "chatSession", "recentMessages" }, allEntries = true)
    public void evictAllCaches() {
        // Method intentionally empty - annotation handles cache eviction
    }

    /**
     * Evict caches for a specific user
     * Note: Only evicts chatSession cache; recentMessages requires allEntries=true
     * due to composite keys
     */
    @CacheEvict(value = "chatSession", key = "#userId")
    public void evictUserCaches(java.util.UUID userId) {
        // Method intentionally empty - annotation handles cache eviction
    }
}
