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
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InactivityDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(InactivityDetectionService.class);

    private final UserActivityRepository userActivityRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Value("${inactivity.quiet-hours.start:22}")
    private int quietHoursStart; // Default 10 PM

    @Value("${inactivity.quiet-hours.end:8}")
    private int quietHoursEnd; // Default 8 AM

    public InactivityDetectionService(UserActivityRepository userActivityRepository,
            NotificationService notificationService,
            NotificationRepository notificationRepository) {
        this.userActivityRepository = userActivityRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Runs hourly to detect inactive users and create gentle notifications.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void detectInactiveUsers() {
        logger.info("🕒 Running Inactivity Detection Job...");

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

                // ✅ Respect quiet hours
                if (isWithinQuietHours(user)) {
                    logger.debug("Skipping quiet hours for user: {}", user.getEmail());
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

    /**
     * Determines if current time is within quiet hours.
     */
    private boolean isWithinQuietHours(User user) {
        LocalTime now = LocalTime.now();
        LocalTime quietStart = LocalTime.of(quietHoursStart, 0);
        LocalTime quietEnd = LocalTime.of(quietHoursEnd, 0);

        if (quietStart.equals(quietEnd)) {
            // Quiet hours disabled
            return false;
        } else if (quietStart.isBefore(quietEnd)) {
            // Quiet hours within same day: [quietStart, quietEnd)
            return now.compareTo(quietStart) >= 0 && now.compareTo(quietEnd) < 0;
        } else {
            // Quiet hours cross midnight: [quietStart, 24:00) or [00:00, quietEnd)
            return now.compareTo(quietStart) >= 0 || now.compareTo(quietEnd) < 0;
        }
    }
}
