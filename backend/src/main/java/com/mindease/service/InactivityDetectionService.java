package com.mindease.service;

import com.mindease.model.User;
import com.mindease.model.UserActivity;
import com.mindease.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class InactivityDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(InactivityDetectionService.class);
    private static final int INACTIVITY_DAYS = 3;

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Runs hourly to detect inactive users and send gentle reminders.
     */
    @Scheduled(cron = "0 0 * * * *") // every hour
    @Transactional
    public void detectInactiveUsers() {
        logger.info("Starting inactivity detection job");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.minusDays(INACTIVITY_DAYS);

        List<UserActivity> inactiveUsers = userActivityRepository.findByLastActiveAtBefore(threshold);
        logger.info("Found {} inactive users", inactiveUsers.size());

        int notificationsCreated = 0;
        for (UserActivity ua : inactiveUsers) {
            User user = ua.getUser();
            
            // Skip if user is in anonymous mode
            if (user.getAnonymousMode()) {
                logger.debug("Skipping anonymous user: {}", user.getEmail());
                continue;
            }

            // Check if we're within quiet hours (default: 10 PM to 8 AM)
            if (isWithinQuietHours()) {
                logger.debug("Skipping notification during quiet hours for user: {}", user.getEmail());
                continue;
            }

            // Prevent duplicate notifications
            if (notificationService.hasNotificationContaining(user, "inactive")) {
                logger.debug("User {} already has inactivity notification, skipping", user.getEmail());
                continue;
            }

            // Create gentle reminder notification
            String message = "Hey there! We've noticed you haven't been active lately. How are you feeling today? 💚";
            notificationService.createNotification(user, "IN_APP", message);
            notificationsCreated++;
            
            logger.info("Created inactivity notification for user: {}", user.getEmail());
        }

        logger.info("Inactivity detection job completed. Created {} notifications", notificationsCreated);
    }

    /**
     * Manual trigger for testing purposes
     */
    @Transactional
    public void manualTrigger() {
        logger.info("Manual trigger for inactivity detection");
        detectInactiveUsers();
    }

    /**
     * Checks whether we're within quiet hours (10 PM to 8 AM).
     * This prevents sending notifications during sleep hours.
     */
    private boolean isWithinQuietHours() {
        LocalTime now = LocalTime.now();
        LocalTime quietStart = LocalTime.of(22, 0); // 10 PM
        LocalTime quietEnd = LocalTime.of(8, 0);    // 8 AM

        if (quietStart.isBefore(quietEnd)) {
            // Quiet hours don't span midnight
            return now.isAfter(quietStart) && now.isBefore(quietEnd);
        } else {
            // Quiet hours span midnight (10 PM to 8 AM)
            return now.isAfter(quietStart) || now.isBefore(quietEnd);
        }
    }
}
