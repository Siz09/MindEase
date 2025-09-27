package com.mindease.service;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OptimizedMoodService {

  @Autowired
  private MoodEntryRepository moodEntryRepository;

  /**
   * Get mood statistics with caching for better performance
   */
  @Cacheable(value = "moodStats", key = "#user.id")
  public Map<String, Object> getMoodStatistics(User user) {
    List<MoodEntry> entries = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
    
    if (entries.isEmpty()) {
      return Map.of(
        "average", 0.0,
        "total", 0,
        "trend", "stable",
        "latest", 0
      );
    }

    double average = entries.stream()
      .mapToInt(MoodEntry::getMoodValue)
      .average()
      .orElse(0.0);

    int latest = entries.get(0).getMoodValue();
    int previous = entries.size() > 1 ? entries.get(1).getMoodValue() : latest;
    
    String trend = "stable";
    if (latest > previous) trend = "up";
    else if (latest < previous) trend = "down";

    return Map.of(
      "average", Math.round(average * 10.0) / 10.0,
      "total", entries.size(),
      "trend", trend,
      "latest", latest
    );
  }

  /**
   * Get mood distribution for charts
   */
  @Cacheable(value = "moodDistribution", key = "#user.id")
  public Map<Integer, Long> getMoodDistribution(User user) {
    List<MoodEntry> entries = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
    
    return entries.stream()
      .collect(Collectors.groupingBy(
        MoodEntry::getMoodValue,
        Collectors.counting()
      ));
  }

  /**
   * Get paginated mood history with optimized queries
   */
  public Page<MoodEntry> getMoodHistory(User user, Pageable pageable) {
    return moodEntryRepository.findByUserOrderByCreatedAtDesc(user, pageable);
  }

  /**
   * Check if user has mood entry for today (optimized query)
   */
  public boolean hasMoodEntryToday(User user) {
    LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
    LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
    
    List<MoodEntry> todaysEntries = moodEntryRepository.findByUserAndCreatedAtBetween(
      user, startOfDay, endOfDay);
    
    return !todaysEntries.isEmpty();
  }
}