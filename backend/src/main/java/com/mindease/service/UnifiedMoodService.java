package com.mindease.service;

import com.mindease.dto.UnifiedMoodRecord;
import com.mindease.model.MoodCheckIn;
import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodCheckInRepository;
import com.mindease.repository.MoodEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service that aggregates mood data from both MoodEntry (1-10 scale) and MoodCheckIn (1-5 scale) systems.
 * Provides a unified API for mood history, trends, and analytics.
 */
@Service
@Transactional
public class UnifiedMoodService {

    private static final Logger log = LoggerFactory.getLogger(UnifiedMoodService.class);

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private MoodCheckInRepository moodCheckInRepository;

    /**
     * Maps a MoodCheckIn score (1-5) to the 1-10 scale.
     * Linear mapping: 1→2, 2→4, 3→6, 4→8, 5→10
     */
    private Integer mapCheckInScoreToTenScale(Integer score) {
        if (score == null) {
            return null;
        }
        // Linear mapping: multiply by 2
        return score * 2;
    }

    /**
     * Get unified mood history for a user, combining both MoodEntry and MoodCheckIn records.
     *
     * @param user The user
     * @param days Number of days to look back
     * @return List of unified mood records, ordered by most recent first
     */
    public List<UnifiedMoodRecord> getUnifiedMoodHistory(User user, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        // Fetch from both sources
        List<MoodEntry> moodEntries = moodEntryRepository
                .findByUserAndCreatedAtAfterOrderByCreatedAtAsc(user, since);
        List<MoodCheckIn> moodCheckIns = moodCheckInRepository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(user.getId(), since);

        // Convert to unified records
        List<UnifiedMoodRecord> records = new ArrayList<>();

        // Add MoodEntry records
        for (MoodEntry entry : moodEntries) {
            records.add(new UnifiedMoodRecord(
                    entry.getId(),
                    entry.getMoodValue(),
                    "mood_entry",
                    entry.getNotes(),
                    null,
                    entry.getCreatedAt()
            ));
        }

        // Add MoodCheckIn records (with score mapping)
        for (MoodCheckIn checkIn : moodCheckIns) {
            records.add(new UnifiedMoodRecord(
                    checkIn.getId(),
                    mapCheckInScoreToTenScale(checkIn.getScore()),
                    "mood_checkin",
                    null, // MoodCheckIn doesn't have notes field
                    checkIn.getCheckinType(),
                    checkIn.getCreatedAt()
            ));
        }

        // Sort by created date, most recent first
        records.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        log.debug("Retrieved {} unified mood records for user {} ({} days)",
                records.size(), user.getId(), days);

        return records;
    }

    /**
     * Get unified mood trend data (daily averages) for visualization.
     *
     * @param user The user
     * @param days Number of days to look back
     * @return Map of date string (YYYY-MM-DD) → average mood value (1-10 scale)
     */
    public Map<String, Double> getUnifiedMoodTrend(User user, int days) {
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);

        // Group by date and calculate averages
        Map<String, Double> trend = records.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getCreatedAt().toLocalDate().toString(),
                        Collectors.averagingInt(UnifiedMoodRecord::getMoodValue)
                ));

        log.debug("Calculated mood trend for user {}: {} days of data", user.getId(), trend.size());
        return trend;
    }

    /**
     * Get average mood value for a user over a period.
     *
     * @param user The user
     * @param days Number of days to look back
     * @return Average mood value (1-10 scale) or null if no data
     */
    public Double getAverageMood(User user, int days) {
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);

        if (records.isEmpty()) {
            return null;
        }

        double average = records.stream()
                .mapToInt(UnifiedMoodRecord::getMoodValue)
                .average()
                .orElse(0.0);

        return average;
    }

    /**
     * Get count of mood records by source.
     *
     * @param user The user
     * @param days Number of days to look back
     * @return Map with "mood_entry" and "mood_checkin" counts
     */
    public Map<String, Long> getMoodCountBySource(User user, int days) {
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);

        return records.stream()
                .collect(Collectors.groupingBy(
                        UnifiedMoodRecord::getSource,
                        Collectors.counting()
                ));
    }

    /**
     * Get the most recent mood record for a user.
     *
     * @param user The user
     * @return Most recent unified mood record or null
     */
    public UnifiedMoodRecord getMostRecentMood(User user) {
        // Get most recent from both sources
        List<MoodEntry> recentEntries = moodEntryRepository
                .findByUserOrderByCreatedAtDesc(user);
        MoodCheckIn recentCheckIn = moodCheckInRepository
                .findFirstByUserIdOrderByCreatedAtDesc(user.getId());

        UnifiedMoodRecord mostRecent = null;
        LocalDateTime mostRecentDate = null;

        // Check MoodEntry
        if (!recentEntries.isEmpty()) {
            MoodEntry entry = recentEntries.get(0);
            if (mostRecentDate == null || entry.getCreatedAt().isAfter(mostRecentDate)) {
                mostRecentDate = entry.getCreatedAt();
                mostRecent = new UnifiedMoodRecord(
                        entry.getId(),
                        entry.getMoodValue(),
                        "mood_entry",
                        entry.getNotes(),
                        null,
                        entry.getCreatedAt()
                );
            }
        }

        // Check MoodCheckIn
        if (recentCheckIn != null) {
            if (mostRecentDate == null || recentCheckIn.getCreatedAt().isAfter(mostRecentDate)) {
                mostRecent = new UnifiedMoodRecord(
                        recentCheckIn.getId(),
                        mapCheckInScoreToTenScale(recentCheckIn.getScore()),
                        "mood_checkin",
                        null,
                        recentCheckIn.getCheckinType(),
                        recentCheckIn.getCreatedAt()
                );
            }
        }

        return mostRecent;
    }
}
