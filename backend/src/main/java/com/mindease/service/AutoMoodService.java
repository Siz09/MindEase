package com.mindease.service;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodEntryRepository;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AutoMoodService {

  private static final Logger logger = LoggerFactory.getLogger(AutoMoodService.class);

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private MoodEntryRepository moodEntryRepository;

  public void manualTrigger() {
    createAutoMoodEntries();
  }

  // Run every day at 12:00 AM
  @Scheduled(cron = "0 0 0 * * ?") // Midnight every day
  public void createAutoMoodEntries() {
    logger.info("Starting automatic mood entry creation at {}", LocalDateTime.now());

    try {
      List<User> users = userRepository.findAll();
      int createdEntries = 0;

      for (User user : users) {
        // Skip anonymous users if needed
        if (user.getAnonymousMode() != null && user.getAnonymousMode()) {
          continue;
        }

        // Check if user already has a mood entry for today
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        List<MoodEntry> todaysEntries = moodEntryRepository.findByUserAndCreatedAtBetween(
          user, startOfDay, endOfDay);

        if (todaysEntries.isEmpty()) {
          // Create an automatic mood entry
          MoodEntry autoMood = new MoodEntry(
            user,
            5, // Neutral mood value
            "Automatic daily mood check-in. How are you feeling today?"
          );
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
