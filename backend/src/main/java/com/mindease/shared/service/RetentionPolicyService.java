package com.mindease.shared.service;

import com.mindease.auth.model.User;
import com.mindease.chat.model.ChatSession;
import com.mindease.chat.repository.ChatSessionRepository;
import com.mindease.chat.repository.MessageRepository;
import com.mindease.journal.repository.JournalEntryRepository;
import com.mindease.mood.repository.MoodEntryRepository;
import com.mindease.auth.repository.UserContextRepository;
import com.mindease.auth.repository.UserRepository;
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

    @Autowired
    private UserContextRepository userContextRepository;

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
            try {
                cleanupSingleUserTransactional(user);
            } catch (Exception e) {
                logger.error("Failed to clean up user {}", user.getId(), e);
            }
        }

        logger.info("Retention policy cleanup completed");
    }

    @Transactional(rollbackFor = Exception.class)
    protected void cleanupSingleUserTransactional(User user) {
        cleanupSingleUser(user);
    }

    private void cleanupSingleUser(User user) {
        // Perform all deletions in sequence - if any fails, entire transaction rolls
        // back
        journalEntryRepository.deleteByUserId(user.getId());
        moodEntryRepository.deleteByUser(user);
        userContextRepository.deleteByUser(user);
        List<ChatSession> sessions = chatSessionRepository.findByUser(user);
        if (!sessions.isEmpty()) {
            messageRepository.deleteByChatSessionIn(sessions);
            chatSessionRepository.deleteAll(sessions);
        }
        userRepository.delete(user);
        logger.debug("Cleaned up data for anonymous user: {}", user.getId());
    }

    /**
     * Additional method for manual trigger of cleanup
     */
    public void manualCleanup() {
        logger.info("Manual retention policy cleanup triggered");
        cleanUpOldData();
    }
}
