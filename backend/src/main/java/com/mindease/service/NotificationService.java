package com.mindease.service;

import com.mindease.model.Notification;
import com.mindease.model.User;
import com.mindease.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String type, String message) {
        Notification notification = new Notification(user, type, message);
        notificationRepository.save(notification);
    }

    /**
     * Check if a user already has a notification containing specific text
     */
    public boolean hasNotificationContaining(User user, String text) {
        return notificationRepository.existsByUserAndMessageContainingIgnoreCase(user, text);
    }
}
