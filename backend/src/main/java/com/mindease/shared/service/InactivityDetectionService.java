package com.mindease.shared.service;

import com.mindease.auth.model.User;
import com.mindease.auth.model.UserActivity;
import com.mindease.notification.model.Notification;
import com.mindease.notification.repository.NotificationRepository;
import com.mindease.notification.service.NotificationService;
import com.mindease.auth.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InactivityDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(InactivityDetectionService.class);

    private final UserActivityRepository userActivityRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    private com.mindease.shared.service.PythonBackgroundJobsClient pythonBackgroundJobsClient;


    public InactivityDetectionService(UserActivityRepository userActivityRepository,
            NotificationService notificationService,
            NotificationRepository notificationRepository) {
        this.userActivityRepository = userActivityRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    public void setPythonBackgroundJobsClient(
            com.mindease.shared.service.PythonBackgroundJobsClient pythonBackgroundJobsClient) {
        this.pythonBackgroundJobsClient = pythonBackgroundJobsClient;
    }

    /**
     * Runs hourly to detect inactive users and create gentle notifications.
     * Now delegates to Python service if available, otherwise uses Java
     * implementation.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void detectInactiveUsers() {
        // Try Python service first
        if (pythonBackgroundJobsClient != null) {
            try {
                logger.info("Triggering Python service for inactivity detection");
                Map<String, Object> result = pythonBackgroundJobsClient.triggerInactivityDetection();
                Object successObj = result.get("success");
                boolean success = Boolean.TRUE.equals(successObj) || "true".equals(successObj);
                if (success) {
                    logger.info("Python inactivity detection completed: {}", result.get("message"));
                    return;
                } else {
                    logger.warn("Python inactivity detection failed, falling back to Java: {}", result.get("message"));
                }
            } catch (Exception e) {
                logger.warn("Python background jobs service unavailable, using Java fallback: {}", e.getMessage());
            }
        }

        // Fallback to Java implementation
        logger.info("🕒 Running Inactivity Detection Job... (Java implementation)");

        LocalDateTime threshold = LocalDateTime.now().minusDays(3);
        int notificationsCreated = 0;

        // ✅ Preload users who already received the inactivity reminder recently
        Set<UUID> notifiedUserIds = notificationRepository.findUserIdsWithNotificationType(
                "INACTIVITY_REMINDER",
                LocalDateTime.now().minusDays(3));

        // ✅ Process in pages to avoid memory pressure
        int pageSize = 100;
        int page = 0;
        org.springframework.data.domain.Page<UserActivity> inactivePage;

        do {
            inactivePage = userActivityRepository.findByLastActiveAtBefore(
                    threshold,
                    org.springframework.data.domain.PageRequest.of(page++, pageSize));

            for (UserActivity ua : inactivePage.getContent()) {
                User user = ua.getUser();

                // ✅ Null check — skip if activity not linked to a valid user
                if (user == null) {
                    logger.warn("UserActivity has no associated user, skipping");
                    continue;
                }

                // ✅ Skip anonymous users
                if (Boolean.TRUE.equals(user.getAnonymousMode())) {
                    logger.debug("Skipping anonymous user: {}", user.getEmail());
                    continue;
                }

                // ✅ Prevent duplicate inactivity notifications
                if (notifiedUserIds.contains(user.getId())) {
                    logger.debug("User {} already received inactivity notification", user.getEmail());
                    continue;
                }

                // ✅ Create gentle reminder safely
                String message = "Hey there! We've noticed you haven't been active lately. How are you feeling today? 💚";

                try {
                    notificationService.createNotification(user, "INACTIVITY_REMINDER", message);
                    notificationsCreated++;
                    logger.info("Created inactivity notification for user: {}", user.getEmail());
                } catch (Exception e) {
                    logger.error("Failed to create notification for user: {}", user.getEmail(), e);
                }
            }
        } while (inactivePage.hasNext());

        logger.info("✅ Inactivity Detection Job completed. Notifications created: {}", notificationsCreated);
    }

    /**
     * Manual trigger for development/testing endpoints
     */
    public void manualTrigger() {
        detectInactiveUsers();
    }
}
