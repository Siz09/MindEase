package com.mindease.repository;

import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
  Page<Message> findByChatSessionOrderByCreatedAtDesc(ChatSession chatSession, Pageable pageable);
  List<Message> findByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);
}
