package com.mindease.chat.repository;

import com.mindease.auth.model.User;
import com.mindease.chat.model.ChatSession;
import com.mindease.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByChatSessionOrderByCreatedAtDesc(ChatSession chatSession, Pageable pageable);

    List<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);

    Page<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession, Pageable pageable);

    long countByChatSession_UserAndIsUserMessageTrueAndCreatedAtBetween(
            User user,
            LocalDateTime start,
            LocalDateTime end);

    @Modifying
    void deleteByChatSessionIn(List<ChatSession> chatSessions);

    /**
     * Find the first user message in a chat session (for preview/title generation)
     */
    @Query("SELECT m FROM Message m WHERE m.chatSession = :chatSession AND m.isUserMessage = true ORDER BY m.createdAt ASC LIMIT 1")
    Optional<Message> findFirstUserMessageByChatSession(@Param("chatSession") ChatSession chatSession);

    /**
     * Count messages in a chat session
     */
    long countByChatSession(ChatSession chatSession);

    /**
     * Delete all messages for a specific chat session
     */
    @Modifying
    void deleteByChatSession(ChatSession chatSession);
}
