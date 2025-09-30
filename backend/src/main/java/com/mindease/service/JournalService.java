package com.mindease.service;

import com.mindease.model.JournalEntry;
import com.mindease.repository.JournalEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class JournalService {

  @Autowired
  private JournalEntryRepository journalEntryRepository;

  public JournalEntry saveJournalEntry(UUID userId, String content) {
    JournalEntry entry = new JournalEntry(userId, content);
    return journalEntryRepository.save(entry);
  }

  public JournalEntry saveJournalEntryWithSummary(UUID userId, String content, String aiSummary, String moodInsight) {
    JournalEntry entry = new JournalEntry(userId, content);
    entry.setAiSummary(aiSummary);
    entry.setMoodInsight(moodInsight);
    return journalEntryRepository.save(entry);
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
}
