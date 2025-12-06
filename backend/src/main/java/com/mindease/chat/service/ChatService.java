package com.mindease.chat.service;

import com.mindease.auth.model.User;
import com.mindease.chat.model.ChatSession;
import com.mindease.chat.model.Message;
import com.mindease.chat.repository.ChatSessionRepository;
import com.mindease.chat.repository.MessageRepository;
import com.mindease.crisis.model.ModerationAction;
import com.mindease.crisis.model.RiskLevel;
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

/**
 * Optimized chat persistence service.
 *
 * This was previously named OptimizedChatService and is now the primary
 * ChatService for working with ChatSession and Message entities.
 */
@Service
@Transactional
public class ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    /**
     * Get or create chat session with optimized query.
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
     * Save message and update session timestamp.
     * Evicts both session and message caches.
     */
    @Caching(evict = {
            @CacheEvict(value = "chatSession", key = "#chatSession.user.id"),
            @CacheEvict(value = "recentMessages", allEntries = true)
    })
    @Transactional
    public Message saveMessage(ChatSession chatSession, String content, boolean isUserMessage,
            boolean isCrisisFlagged) {
        chatSession.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(chatSession);

        Message message = new Message(chatSession, content, isUserMessage);
        message.setIsCrisisFlagged(isCrisisFlagged);
        return messageRepository.save(message);
    }

    /**
     * Save message with full safety metadata.
     * Evicts both session and message caches.
     */
    @Caching(evict = {
            @CacheEvict(value = "chatSession", key = "#chatSession.user.id"),
            @CacheEvict(value = "recentMessages", allEntries = true)
    })
    @Transactional
    public Message saveMessageWithSafety(ChatSession chatSession, String content, boolean isUserMessage,
            RiskLevel riskLevel, ModerationAction moderationAction,
            String moderationReason) {
        chatSession.setUpdatedAt(LocalDateTime.now());
        chatSessionRepository.save(chatSession);

        Message message = new Message(chatSession, content, isUserMessage);
        message.setIsCrisisFlagged(riskLevel.isHighOrCritical());
        message.setRiskLevel(riskLevel);
        message.setSafetyChecked(true);
        message.setModerationAction(moderationAction);
        message.setModerationReason(moderationReason);

        return messageRepository.save(message);
    }

    /**
     * Get chat history with pagination.
     */
    public Page<Message> getChatHistory(ChatSession chatSession, Pageable pageable) {
        return messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable);
    }

    /**
     * Get recent messages for context (cached).
     * Caches the last N messages for each chat session to reduce DB queries.
     */
    @Cacheable(value = "recentMessages", key = "#chatSession.id + '_' + #limit")
    public java.util.List<Message> getRecentMessages(ChatSession chatSession, int limit) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                0,
                limit,
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC,
                        "createdAt"));
        java.util.List<Message> messages = new ArrayList<>(
                messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable).getContent());
        Collections.reverse(messages);
        return messages;
    }

    /**
     * Evict all cache entries across all users and sessions.
     */
    @CacheEvict(value = { "chatSession", "recentMessages" }, allEntries = true)
    public void evictAllCaches() {
        // No-op; annotation handles eviction.
    }

    /**
     * Evict caches for a specific user.
     * Note: Only evicts chatSession cache; recentMessages requires allEntries=true
     * due to composite keys.
     */
    @CacheEvict(value = "chatSession", key = "#userId")
    public void evictUserCaches(java.util.UUID userId) {
        // No-op; annotation handles eviction.
    }
}
