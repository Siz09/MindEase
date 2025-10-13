package com.mindease.repository;

import com.mindease.model.Notification;
import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // 1️⃣ Paginated retrieval for UI or general processing
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // 2️⃣ Paginated retrieval of unsent notifications
    Page<Notification> findByUserAndIsSentFalseOrderByCreatedAtAsc(User user, Pageable pageable);

    // 3️⃣ Hard-limit retrieval of unsent notifications (e.g., batch sending)
    List<Notification> findTop100ByUserAndIsSentFalseOrderByCreatedAtAsc(User user);

    // 3b️⃣ Retrieve all unsent notifications (use with caution)
    List<Notification> findByUserAndIsSentFalse(User user);

    // 4️⃣ Count of unsent notifications
    long countByUserAndIsReadFalse(User user);

    // 5️⃣ Check if user has notification containing specific text
    boolean existsByUserAndMessageContainingIgnoreCase(User user, String text);

    // 6️⃣ Efficient lookup of users who already received a specific notification
    // type since a timestamp
    @Query("SELECT DISTINCT n.user.id FROM Notification n WHERE n.type = :type AND n.createdAt > :since")
    java.util.Set<java.util.UUID> findUserIdsWithNotificationType(@Param("type") String type,
            @Param("since") java.time.LocalDateTime since);

    // 7️⃣ Bulk update to mark all notifications as sent for a user (performance
    // optimized)
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadForUser(@Param("user") User user);
}
