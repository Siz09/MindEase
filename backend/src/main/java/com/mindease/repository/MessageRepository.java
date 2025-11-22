package com.mindease.repository;

import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Page<Message> findByChatSessionOrderByCreatedAtDesc(ChatSession chatSession, Pageable pageable);

    List<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);

    Page<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession, Pageable pageable);

    long countByChatSession_UserAndIsUserMessageTrueAndCreatedAtBetween(
            User user,
            LocalDateTime start,
            LocalDateTime end);

    /**
     * Bulk delete for memory-efficient cleanup operations.
     *
     * NOTE: Transaction management should be handled at the service layer.
     * The calling service method must be annotated with @Transactional.
     */
    @Modifying
    void deleteByChatSessionIn(List<ChatSession> chatSessions);
}
