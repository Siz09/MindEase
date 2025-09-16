package com.mindease.repository;

import com.mindease.model.ChatSession;
import com.mindease.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
  List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);
  // We'll add more custom methods as needed in future days
}
