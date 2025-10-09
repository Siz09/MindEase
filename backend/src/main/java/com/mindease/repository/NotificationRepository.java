package com.mindease.repository;

import com.mindease.model.Notification;
import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

  List<Notification> findByUserAndIsSentFalseOrderByCreatedAtAsc(User user);

  long countByUserAndIsSentFalse(User user);

}
