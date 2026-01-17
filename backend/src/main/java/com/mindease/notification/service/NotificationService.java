package com.mindease.notification.service;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.notification.model.Notification;
import com.mindease.notification.repository.NotificationRepository;
import com.mindease.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private static final String NOTIFICATION_TYPE_IN_APP = "IN_APP";
    private static final String DEFAULT_ADMIN_EMAIL_SUBJECT = "MindEase Alert";

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void createNotification(User user, String type, String message) {
        if (user == null || type == null || message == null) {
            throw new IllegalArgumentException("User, type, and message must not be null");
        }

        Notification notification = new Notification(user, type, message);
        notificationRepository.save(notification);
    }

    /**
     * Check if a user already has a notification containing specific text.
     */
    public boolean hasNotificationContaining(User user, String text) {
        return notificationRepository.existsByUserAndMessageContainingIgnoreCase(user, text);
    }

    /**
     * Attempt to send queued notifications.
     * Emails are sent individually with error handling to avoid transaction issues.
     */
    @Transactional
    public void sendQueuedNotifications(User user) {
        if (user == null || emailService == null) {
            return;
        }

        List<Notification> pending = notificationRepository.findByUserAndIsSentFalse(user);
        for (Notification n : pending) {
            try {
                emailService.sendEmail(user.getEmail(), "MindEase Notification", n.getMessage());
                n.setIsSent(true);
                notificationRepository.save(n);
            } catch (Exception e) {
                logger.warn("Failed to send notification to user {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    // --- Admin helpers ---
    public void notifyAdmins(String title, String body) {
        try {
            var admins = userRepository.findByRole(Role.ADMIN);
            String message = (title != null && !title.isBlank() ? (title + ": ") : "") + (body == null ? "" : body);
            for (User admin : admins) {
                try {
                    createNotification(admin, NOTIFICATION_TYPE_IN_APP, message);
                } catch (Exception e) {
                    logger.warn("Failed creating admin notification for {}: {}", admin.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("notifyAdmins failed: {}", e.getMessage(), e);
        }
    }

    public void emailAdmins(String subject, String body) {
        if (emailService == null)
            return;
        try {
            var admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                try {
                    emailService.sendEmail(admin.getEmail(),
                            subject != null ? subject : DEFAULT_ADMIN_EMAIL_SUBJECT,
                            body != null ? body : "");
                } catch (Exception e) {
                    logger.warn("Failed emailing admin {}: {}", admin.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("emailAdmins failed: {}", e.getMessage(), e);
        }
    }

    public void sendPushNotification(User user, String title, String body) {
        if (user == null || user.getFcmToken() == null || user.getFcmToken().isEmpty()) {
            return;
        }

        try {
            com.google.firebase.messaging.Message message = com.google.firebase.messaging.Message.builder()
                    .setToken(user.getFcmToken())
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putData("click_action", "FLUTTER_NOTIFICATION_CLICK")
                    .build();

            String response = com.google.firebase.messaging.FirebaseMessaging.getInstance().send(message);
            logger.info("Sent push notification to user {}: {}", user.getId(), response);
        } catch (Exception e) {
            logger.error("Failed to send push notification to user {}: {}", user.getId(), e.getMessage());
        }
    }
}
