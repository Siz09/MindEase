package com.mindease.service;

import com.mindease.model.ChatSession;
import com.mindease.model.User;
import com.mindease.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RetentionPolicyService {

    private static final Logger logger = LoggerFactory.getLogger(RetentionPolicyService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    /**
     * Scheduled task to clean up old data based on retention policy
     * Runs every day at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * ?") // Every day at 2:00 AM
    @Transactional
    public void cleanUpOldData() {
        logger.info("Retention policy cleanup started");

        // 1. Identify anonymous users created more than 30 days ago
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        List<User> anonymousUsers = userRepository.findByAnonymousModeTrueAndCreatedAtBefore(threshold);

        logger.info("Found {} anonymous users to clean up", anonymousUsers.size());

        for (User user : anonymousUsers) {
            try {
                // 2. Delete Journal Entries
                journalEntryRepository.deleteByUserId(user.getId());

                // 3. Delete Mood Entries
                moodEntryRepository.deleteByUser(user);

                // 4. Delete Chat Sessions and Messages
                List<ChatSession> sessions = chatSessionRepository.findByUser(user);
                if (!sessions.isEmpty()) {
                    messageRepository.deleteByChatSessionIn(sessions);
                    chatSessionRepository.deleteAll(sessions);
                }

                // 5. Delete the User
                userRepository.delete(user);

                logger.debug("Cleaned up data for anonymous user: {}", user.getId());
            } catch (Exception e) {
                logger.error("Failed to clean up user {}", user.getId(), e);
            }
        }

        logger.info("Retention policy cleanup completed");
    }

    /**
     * Additional method for manual trigger of cleanup
     */
    @Transactional
    public void manualCleanup() {
        logger.info("Manual retention policy cleanup triggered");
        cleanUpOldData();
    }
}
