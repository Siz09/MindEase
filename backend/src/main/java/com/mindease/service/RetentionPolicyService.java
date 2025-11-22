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
    public void cleanUpOldData() {
        logger.info("Retention policy cleanup started");

        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        List<User> anonymousUsers = userRepository.findByAnonymousModeTrueAndCreatedAtBefore(threshold);

        logger.info("Found {} anonymous users to clean up", anonymousUsers.size());

        for (User user : anonymousUsers) {
            cleanupSingleUser(user);
        }

        logger.info("Retention policy cleanup completed");
    }

    @Transactional
    private void cleanupSingleUser(User user) {
        try {
            journalEntryRepository.deleteByUserId(user.getId());
            moodEntryRepository.deleteByUser(user);
            List<ChatSession> sessions = chatSessionRepository.findByUser(user);
            if (!sessions.isEmpty()) {
                messageRepository.deleteByChatSessionIn(sessions);
                chatSessionRepository.deleteAll(sessions);
            }
            userRepository.delete(user);
            logger.debug("Cleaned up data for anonymous user: {}", user.getId());
        } catch (Exception e) {
            logger.error("Failed to clean up user {}", user.getId(), e);
        }
    }

    /**
     * Additional method for manual trigger of cleanup
     */
    public void manualCleanup() {
        logger.info("Manual retention policy cleanup triggered");
        cleanUpOldData();
    }
}
