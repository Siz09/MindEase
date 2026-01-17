package com.mindease.journal.service;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.journal.model.JournalEntry;
import com.mindease.journal.repository.JournalEntryRepository;
import com.mindease.chat.service.OpenAIService;
import com.mindease.shared.service.PythonAIServiceClient;
import com.mindease.mood.model.MoodEntry;
import com.mindease.mood.repository.MoodEntryRepository;
import java.time.YearMonth;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class JournalService {

    private static final Logger logger = LoggerFactory.getLogger(JournalService.class);

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private PythonAIServiceClient pythonAIServiceClient;

    @Autowired(required = false)
    private OpenAIService openAIService; // Keep for fallback

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private UserRepository userRepository;

    private static final int MAX_TITLE_LENGTH = 150;

    @Transactional
    public JournalEntry saveJournalEntry(UUID userId, String title, String content, Integer moodValue) {
        return saveJournalEntry(userId, title, content, moodValue, false);
    }

    @Transactional
    public JournalEntry saveJournalEntry(UUID userId, String title, String content, Integer moodValue,
            boolean isPremium) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty");
        }

        // Validate mood value if provided
        if (moodValue != null && (moodValue < 1 || moodValue > 10)) {
            throw new IllegalArgumentException("Mood value must be between 1 and 10");
        }

        String normalizedContent = content.trim();
        String normalizedTitle = normalizeTitle(title);

        JournalEntry entry = new JournalEntry(userId, normalizedTitle, normalizedContent);

        // Create linked MoodEntry if moodValue is provided
        if (moodValue != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            MoodEntry moodEntry = new MoodEntry(user, moodValue, null);
            moodEntry = moodEntryRepository.save(moodEntry);
            entry.setMoodEntry(moodEntry);

            logger.info("Created linked mood entry (value: {}) for journal entry", moodValue);
        }

        JournalEntry savedEntry = journalEntryRepository.save(entry);

        // Generate AI summary asynchronously only if within limits or premium
        if (isPremium || canGenerateAISummary(userId)) {
            generateAndSaveAISummary(savedEntry);
        } else {
            logger.info("Skipping AI summary generation for free user (monthly limit reached): userId={}", userId);
            savedEntry.setAiSummary(
                    "AI summaries are limited to 1 per month for free users. Upgrade to Premium for unlimited AI summaries.");
            savedEntry.setMoodInsight(
                    "Mood insights are limited to 1 per month for free users. Upgrade to Premium for unlimited insights.");
            journalEntryRepository.save(savedEntry);
        }

        return savedEntry;
    }

    // Overloaded method for backward compatibility
    public JournalEntry saveJournalEntry(UUID userId, String title, String content) {
        return saveJournalEntry(userId, title, content, null);
    }

    @Transactional
    public JournalEntry saveJournalEntryWithSummary(UUID userId, String title, String content, String aiSummary,
            String moodInsight) {
        JournalEntry entry = new JournalEntry(userId, normalizeTitle(title),
                content != null ? content.trim() : content);
        entry.setAiSummary(aiSummary);
        entry.setMoodInsight(moodInsight);
        return journalEntryRepository.save(entry);
    }

    private String normalizeTitle(String title) {
        if (title == null) {
            return null;
        }
        String trimmed = title.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() > MAX_TITLE_LENGTH ? trimmed.substring(0, MAX_TITLE_LENGTH) : trimmed;
    }

    @Async
    public CompletableFuture<Void> generateAndSaveAISummary(JournalEntry entry) {
        try {
            logger.info("Generating AI summary for journal entry: {}", entry.getId());

            // Call Python AI service for summaries
            Optional<String> summaryOpt = pythonAIServiceClient.generateJournalSummary(entry.getContent());
            Optional<String> insightOpt = pythonAIServiceClient.generateMoodInsight(entry.getContent());

            // Fallback to Java OpenAIService if Python service unavailable
            if (summaryOpt.isEmpty() && openAIService != null) {
                logger.debug("Python service unavailable, falling back to Java OpenAIService for summary");
                summaryOpt = openAIService.generateJournalSummary(entry.getContent());
            }
            if (insightOpt.isEmpty() && openAIService != null) {
                logger.debug("Python service unavailable, falling back to Java OpenAIService for insight");
                insightOpt = openAIService.generateMoodInsight(entry.getContent());
            }

            String summary = summaryOpt.orElse("Summary unavailable at this time.");
            String insight = insightOpt.orElse("Mood insight unavailable at this time.");

            // Update the entry with AI-generated content
            entry.setAiSummary(summary);
            entry.setMoodInsight(insight);
            journalEntryRepository.save(entry);

            logger.info("Successfully saved AI summary for journal entry: {}", entry.getId());

        } catch (Exception e) {
            // Log error with context
            String errorMessage = e.getMessage();
            boolean isConfigError = errorMessage != null &&
                    (errorMessage.contains("API key") ||
                            errorMessage.contains("authentication") ||
                            errorMessage.contains("401") ||
                            errorMessage.contains("403"));

            if (isConfigError) {
                logger.error("Configuration error generating AI summary for journal entry {}: {}. " +
                        "Check OpenAI API key configuration.", entry.getId(), errorMessage, e);
                entry.setAiSummary("Summary unavailable - AI service not configured. Please contact support.");
                entry.setMoodInsight("Mood insight unavailable - AI service not configured.");
            } else {
                logger.warn("Temporary failure generating AI summary for journal entry {}: {}. " +
                        "Will retry on next entry.", entry.getId(), errorMessage, e);
                entry.setAiSummary("Summary unavailable due to temporary technical issues. Please try again later.");
                entry.setMoodInsight("Mood insight unavailable due to temporary technical issues.");
            }
            journalEntryRepository.save(entry);
        }

        return CompletableFuture.completedFuture(null);
    }

    public Page<JournalEntry> getJournalHistory(UUID userId, Pageable pageable) {
        return journalEntryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public List<JournalEntry> getRecentJournalEntries(UUID userId) {
        return journalEntryRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getJournalEntryCount(UUID userId) {
        return journalEntryRepository.countByUserId(userId);
    }

    public List<JournalEntry> getJournalEntriesBefore(UUID userId, LocalDateTime beforeDate, Pageable pageable) {
        return journalEntryRepository.findByUserIdAndCreatedAtBeforeOrderByCreatedAtDesc(userId, beforeDate, pageable);
    }

    public boolean isAIAvailable() {
        return openAIService != null && openAIService.isOpenAIConfigured();
    }

    /**
     * Check if free user can generate AI summary this month.
     * Free users are limited to 1 AI summary per month.
     * Premium users have unlimited summaries.
     */
    private boolean canGenerateAISummary(UUID userId) {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        long summariesThisMonth = journalEntryRepository.countByUserIdWithAISummaryAndCreatedAtAfter(userId,
                startOfMonth);
        int freeMonthlyAILimit = 1; // Free users: 1 AI summary per month

        boolean canGenerate = summariesThisMonth < freeMonthlyAILimit;
        logger.debug("AI summary limit check: userId={}, summariesThisMonth={}, limit={}, canGenerate={}",
                userId, summariesThisMonth, freeMonthlyAILimit, canGenerate);
        return canGenerate;
    }
}
