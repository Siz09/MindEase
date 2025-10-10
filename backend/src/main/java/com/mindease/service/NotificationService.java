package com.mindease.service;

import com.mindease.model.Notification;
import com.mindease.model.User;
import com.mindease.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private EmailService emailService;

    @Transactional
    public void createNotification(User user, String type, String message) {
        if (user == null || type == null || message == null) {
            throw new IllegalArgumentException("User, type, and message must not be null");
        }

        Notification notification = new Notification(user, type, message);
        notificationRepository.save(notification);
    }

    /**
     * Check if a user already has a notification containing specific text
     */
    public boolean hasNotificationContaining(User user, String text) {
        return notificationRepository.existsByUserAndMessageContainingIgnoreCase(user, text);
    }

    /**
     * Attempt to send queued notifications if not in user's quiet hours
     * Emails are sent individually with error handling to avoid transaction issues
     */
    @Transactional
    public void sendQueuedNotifications(User user) {
        if (user == null || emailService == null) {
            return;
        }

        if (isWithinQuietHours(user))
            return;

        List<Notification> pending = notificationRepository.findByUserAndIsSentFalse(user);
        for (Notification n : pending) {
            try {
                emailService.sendEmail(user.getEmail(), "MindEase Notification", n.getMessage());
                n.setIsSent(true);
                notificationRepository.save(n);
            } catch (Exception e) {
                logger.warn("Failed to send notification to user {}: {}", user.getEmail(), e.getMessage());
                // Optional: increment retry count or save failure info
            }
        }
    }

    private boolean isWithinQuietHours(User user) {
        LocalTime now = LocalTime.now();
        LocalTime start = user.getQuietHoursStart();
        LocalTime end = user.getQuietHoursEnd();
        if (start == null || end == null)
            return false;
        if (start.isBefore(end)) {
            return now.isAfter(start) && now.isBefore(end);
        } else { // wraps around midnight
            return now.isAfter(start) || now.isBefore(end);
        }
    }
}
