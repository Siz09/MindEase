package com.mindease.chat.repository;

import com.mindease.auth.model.User;
import com.mindease.chat.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);

    List<ChatSession> findByUser(User user);
}

