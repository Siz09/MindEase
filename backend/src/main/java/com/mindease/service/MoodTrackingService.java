package com.mindease.service;

import com.mindease.model.ChatSession;
import com.mindease.model.MoodCheckIn;
import com.mindease.model.User;
import com.mindease.repository.MoodCheckInRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing mood check-ins and mood trend analysis.
 * Supports pre-chat, post-chat, and standalone mood tracking.
 */
@Service
@Transactional
public class MoodTrackingService {

    private static final Logger log = LoggerFactory.getLogger(MoodTrackingService.class);

    @Autowired
    private MoodCheckInRepository moodCheckInRepository;

    /**
     * Create a new mood check-in for a user.
     *
     * @param user The user
     * @param score Mood score (1-5: 1=very bad, 5=very good)
     * @param tags Optional mood tags (e.g., ["anxious", "stressed"])
     * @param checkinType Type: "pre_chat", "post_chat", "standalone"
     * @param session Optional chat session to link
     * @return The created check-in
     */
    public MoodCheckIn createCheckIn(User user, Integer score, List<String> tags,
                                     String checkinType, ChatSession session) {
        if (score == null || score < 1 || score > 5) {
            throw new IllegalArgumentException("Mood score must be between 1 and 5");
        }

        if (!isValidCheckinType(checkinType)) {
            throw new IllegalArgumentException("Invalid checkin type: " + checkinType);
        }

        MoodCheckIn checkIn = new MoodCheckIn(user, score, tags, checkinType);
        if (session != null) {
            checkIn.setSession(session);
        }

        MoodCheckIn saved = moodCheckInRepository.save(checkIn);
        log.info("Created mood check-in for user {}: score={}, type={}",
                 user.getId(), score, checkinType);

        return saved;
    }

    /**
     * Get recent mood check-ins for a user.
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @return List of check-ins ordered by most recent first
     */
    public List<MoodCheckIn> getRecentCheckIns(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return moodCheckInRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(
            userId, since
        );
    }

    /**
     * Get mood trend data for visualization (daily averages).
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @return Map of date → average score
     */
    public Map<String, Double> getMoodTrend(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> rawData = moodCheckInRepository.getMoodTrendByDate(userId, since);

        Map<String, Double> trend = new LinkedHashMap<>();
        for (Object[] row : rawData) {
            String date = row[0].toString(); // DATE(created_at)
            Double avgScore = ((Number) row[1]).doubleValue(); // AVG(score)
            trend.put(date, avgScore);
        }

        return trend;
    }

    /**
     * Get average mood score over a period.
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @return Average score or null if no data
     */
    public Double getAverageMoodScore(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return moodCheckInRepository.getAverageMoodScore(userId, since);
    }

    /**
     * Get mood statistics by check-in type.
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @return Map of check-in type → count
     */
    public Map<String, Long> getCheckInTypeStats(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> rawData = moodCheckInRepository.countByCheckinType(userId, since);

        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : rawData) {
            String type = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            stats.put(type, count);
        }

        return stats;
    }

    /**
     * Get most common mood tags for a user.
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @param limit Max number of tags to return
     * @return List of tag → count, ordered by most common
     */
    public Map<String, Long> getMostCommonTags(UUID userId, int days, int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MoodCheckIn> checkIns = moodCheckInRepository
            .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);

        // Flatten all tags and count occurrences
        Map<String, Long> tagCounts = checkIns.stream()
            .filter(c -> c.getTags() != null)
            .flatMap(c -> c.getTags().stream())
            .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));

        // Sort by count descending and limit
        return tagCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(limit)
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue,
                (e1, e2) -> e1,
                LinkedHashMap::new
            ));
    }

    /**
     * Compare pre-chat and post-chat mood for sessions.
     * Useful for measuring conversation impact.
     *
     * @param userId The user's ID
     * @param days Number of days to look back
     * @return Map with improvement metrics
     */
    public Map<String, Object> analyzeChatImpact(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MoodCheckIn> checkIns = moodCheckInRepository
            .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);

        // Group by session
        Map<UUID, List<MoodCheckIn>> bySession = checkIns.stream()
            .filter(c -> c.getSession() != null)
            .collect(Collectors.groupingBy(c -> c.getSession().getId()));

        int sessionsWithBothCheckins = 0;
        int sessionsImproved = 0;
        double totalImprovement = 0.0;

        for (List<MoodCheckIn> sessionCheckins : bySession.values()) {
            MoodCheckIn preChat = sessionCheckins.stream()
                .filter(c -> "pre_chat".equals(c.getCheckinType()))
                .findFirst().orElse(null);

            MoodCheckIn postChat = sessionCheckins.stream()
                .filter(c -> "post_chat".equals(c.getCheckinType()))
                .findFirst().orElse(null);

            if (preChat != null && postChat != null) {
                sessionsWithBothCheckins++;
                int improvement = postChat.getScore() - preChat.getScore();
                totalImprovement += improvement;
                if (improvement > 0) {
                    sessionsImproved++;
                }
            }
        }

        Map<String, Object> impact = new HashMap<>();
        impact.put("sessionsWithBothCheckins", sessionsWithBothCheckins);
        impact.put("sessionsImproved", sessionsImproved);
        impact.put("averageImprovement", sessionsWithBothCheckins > 0
            ? totalImprovement / sessionsWithBothCheckins
            : 0.0);
        impact.put("improvementRate", sessionsWithBothCheckins > 0
            ? (double) sessionsImproved / sessionsWithBothCheckins
            : 0.0);

        return impact;
    }

    /**
     * Get the most recent check-in for a user.
     *
     * @param userId The user's ID
     * @return The most recent check-in or null
     */
    public MoodCheckIn getLastCheckIn(UUID userId) {
        return moodCheckInRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
    }

    private boolean isValidCheckinType(String type) {
        return "pre_chat".equals(type) || "post_chat".equals(type) || "standalone".equals(type);
    }
}
