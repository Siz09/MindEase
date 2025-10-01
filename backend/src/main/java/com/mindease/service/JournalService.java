package com.mindease.service;

import com.mindease.model.JournalEntry;
import com.mindease.repository.JournalEntryRepository;
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
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class JournalService {

    private static final Logger logger = LoggerFactory.getLogger(JournalService.class);

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private OpenAIService openAIService;

    @Transactional
    public JournalEntry saveJournalEntry(UUID userId, String content) {
        JournalEntry entry = new JournalEntry(userId, content);
        JournalEntry savedEntry = journalEntryRepository.save(entry);
        
        // Generate AI summary asynchronously
        generateAndSaveAISummary(savedEntry);
        
        return savedEntry;
    }

    @Transactional
    public JournalEntry saveJournalEntryWithSummary(UUID userId, String content, String aiSummary, String moodInsight) {
        JournalEntry entry = new JournalEntry(userId, content);
        entry.setAiSummary(aiSummary);
        entry.setMoodInsight(moodInsight);
        return journalEntryRepository.save(entry);
    }

    @Async
    public CompletableFuture<Void> generateAndSaveAISummary(JournalEntry entry) {
        try {
            logger.info("Generating AI summary for journal entry: {}", entry.getId());
            
            // Generate summary
            var summaryFuture = openAIService.generateJournalSummary(entry.getContent());
            var insightFuture = openAIService.generateMoodInsight(entry.getContent());
            
            String summary = summaryFuture.orElse("Summary unavailable at this time.");
            String insight = insightFuture.orElse("Mood insight unavailable at this time.");
            
            // Update the entry with AI-generated content
            entry.setAiSummary(summary);
            entry.setMoodInsight(insight);
            journalEntryRepository.save(entry);
            
            logger.info("Successfully saved AI summary for journal entry: {}", entry.getId());
            
        } catch (Exception e) {
            logger.error("Failed to generate AI summary for journal entry {}: {}", 
                        entry.getId(), e.getMessage(), e);
            
            // Set fallback messages
            entry.setAiSummary("Summary unavailable due to technical issues.");
            entry.setMoodInsight("Mood insight unavailable.");
            journalEntryRepository.save(entry);
        }
        
        return CompletableFuture.completedFuture(null);
    }

    public Page<JournalEntry> getJournalHistory(UUID userId, Pageable pageable) {
        return journalEntryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public List<JournalEntry> getRecentJournalEntries(UUID userId) {
        return journalEntryRepository.findRecentByUserId(userId);
    }

    public long getJournalEntryCount(UUID userId) {
        return journalEntryRepository.countByUserId(userId);
    }

    public List<JournalEntry> getJournalEntriesBefore(UUID userId, LocalDateTime beforeDate, Pageable pageable) {
        return journalEntryRepository.findByUserIdAndCreatedAtBeforeOrderByCreatedAtDesc(userId, beforeDate, pageable);
    }

    public boolean isAIAvailable() {
        return openAIService.isOpenAIConfigured();
    }
}
