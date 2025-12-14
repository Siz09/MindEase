package com.mindease.mood.service;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.mood.model.MoodEntry;
import com.mindease.mood.repository.MoodEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class AutoMoodService {

    private static final Logger logger = LoggerFactory.getLogger(AutoMoodService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired(required = false)
    private com.mindease.shared.service.PythonBackgroundJobsClient pythonBackgroundJobsClient;

    public void manualTrigger() {
        createAutoMoodEntries();
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void createAutoMoodEntries() {
        // Try Python service first
        if (pythonBackgroundJobsClient != null) {
            try {
                logger.info("Triggering Python service for auto mood creation");
                Map<String, Object> result = pythonBackgroundJobsClient.triggerAutoMoodCreation();
                if (result != null) {
                    Object successObj = result.get("success");
                    if (Boolean.TRUE.equals(successObj)) {
                        logger.info("Python auto mood creation completed: {}", result.get("message"));
                        return;
                    } else {
                        logger.warn("Python auto mood creation failed, falling back to Java: {}",
                                result.get("message"));
                    }
                } else {
                    logger.warn("Python service returned null result, falling back to Java");
                }
            } catch (Exception e) {
                logger.warn("Python background jobs service unavailable, using Java fallback: {}", e.getMessage());
            }
        }

        // Fallback to Java implementation
        logger.info("Starting automatic mood entry creation at {} (Java implementation)", LocalDateTime.now());

        try {
            List<User> users = userRepository.findAll();
            int createdEntries = 0;

            for (User user : users) {
                if (user.getAnonymousMode() != null && user.getAnonymousMode()) {
                    continue;
                }

                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

                List<MoodEntry> todaysEntries = moodEntryRepository.findByUserAndCreatedAtBetween(
                        user, startOfDay, endOfDay);

                if (todaysEntries.isEmpty()) {
                    MoodEntry autoMood = new MoodEntry(
                            user,
                            5,
                            "Automatic daily mood check-in. How are you feeling today?");
                    moodEntryRepository.save(autoMood);
                    createdEntries++;
                    logger.info("Created auto mood entry for user: {}", user.getEmail());
                }
            }

            logger.info("Auto mood entry creation completed. Created {} entries.", createdEntries);

        } catch (Exception e) {
            logger.error("Error creating automatic mood entries: {}", e.getMessage(), e);
        }
    }
}
