package com.mindease.service;

import com.mindease.model.MindfulnessSession;
import com.mindease.model.MindfulnessSessionActivity;
import com.mindease.model.User;
import com.mindease.repository.MindfulnessSessionActivityRepository;
import com.mindease.repository.MindfulnessSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MindfulnessActivityService {

    @Autowired
    private MindfulnessSessionActivityRepository activityRepository;

    @Autowired
    private MindfulnessSessionRepository sessionRepository;

    /**
     * Record a session completion
     */
    public MindfulnessSessionActivity recordCompletion(
            User user, UUID sessionId, Integer durationMinutes, Integer rating,
            Integer moodBefore, Integer moodAfter) {

        MindfulnessSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        MindfulnessSessionActivity activity = new MindfulnessSessionActivity(user, session, LocalDateTime.now());
        activity.setDurationMinutes(durationMinutes != null ? durationMinutes : session.getDuration());
        activity.setRating(rating);
        activity.setMoodBefore(moodBefore);
        activity.setMoodAfter(moodAfter);

        return activityRepository.save(activity);
    }

    /**
     * Get current streak (consecutive days with at least one session)
     */
    public Map<String, Object> getUserStreak(User user) {
        List<MindfulnessSessionActivity> allActivities = activityRepository.findByUserOrderByCompletedAtDesc(user);

        if (allActivities.isEmpty()) {
            return Map.of(
                    "currentStreak", 0,
                    "longestStreak", 0,
                    "isActive", false
            );
        }

        int currentStreak = 0;
        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;
        boolean countingFromToday = true;

        // Check current streak (counting backwards from today)
        while (true) {
            LocalDate finalCheckDate = checkDate;
            boolean hasSessionOnDate = allActivities.stream()
                    .anyMatch(activity -> activity.getCompletedAt().toLocalDate().equals(finalCheckDate));

            if (hasSessionOnDate) {
                currentStreak++;
                countingFromToday = false; // We found at least one day with activity
                checkDate = checkDate.minusDays(1);
            } else if (countingFromToday && checkDate.equals(today)) {
                // Today has no session yet, but streak might continue from yesterday
                checkDate = checkDate.minusDays(1);
            } else {
                // Streak broken
                break;
            }

            // Safety limit
            if (checkDate.isBefore(today.minusYears(1))) {
                break;
            }
        }

        // Get longest streak
        int longestStreak = calculateLongestStreak(allActivities);

        return Map.of(
                "currentStreak", currentStreak,
                "longestStreak", longestStreak,
                "isActive", currentStreak > 0
        );
    }

    /**
     * Calculate longest streak from activity list
     */
    private int calculateLongestStreak(List<MindfulnessSessionActivity> activities) {
        if (activities.isEmpty()) {
            return 0;
        }

        int maxStreak = 0;
        int currentStreak = 0;
        LocalDate previousDate = null;

        for (MindfulnessSessionActivity activity : activities) {
            LocalDate activityDate = activity.getCompletedAt().toLocalDate();

            if (previousDate == null) {
                currentStreak = 1;
                previousDate = activityDate;
            } else if (activityDate.equals(previousDate)) {
                // Same day, don't increment
                continue;
            } else if (activityDate.equals(previousDate.minusDays(1))) {
                // Consecutive day
                currentStreak++;
                previousDate = activityDate;
            } else {
                // Streak broken
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
                previousDate = activityDate;
            }
        }

        return Math.max(maxStreak, currentStreak);
    }

    /**
     * Get total minutes practiced
     */
    public Long getTotalMinutes(User user, LocalDateTime since) {
        Long total = activityRepository.sumDurationMinutesByUserSince(user, since);
        return total != null ? total : 0L;
    }

    /**
     * Get favorite sessions (most completed)
     */
    public List<UUID> getFavoriteSessions(User user, int limit) {
        List<Object[]> favorites = activityRepository.findFavoriteSessionsByUser(user);
        return favorites.stream()
                .limit(limit)
                .map(result -> (UUID) result[0])
                .collect(Collectors.toList());
    }

    /**
     * Get user's session history
     */
    public List<MindfulnessSessionActivity> getSessionHistory(User user, int limit) {
        return activityRepository.findByUserOrderByCompletedAtDesc(user).stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Get activities for date range
     */
    public List<MindfulnessSessionActivity> getActivitiesInRange(
            User user, LocalDateTime start, LocalDateTime end) {
        return activityRepository.findByUserAndCompletedAtBetween(user, start, end);
    }

    /**
     * Count sessions between two dates
     */
    public Long countSessionsBetween(User user, LocalDateTime start, LocalDateTime end) {
        List<MindfulnessSessionActivity> activities = activityRepository.findByUserAndCompletedAtBetween(user, start, end);
        return (long) activities.size();
    }

    /**
     * Check if user has completed a session
     */
    public boolean hasCompletedSession(User user, UUID sessionId) {
        return activityRepository.findBySessionIdOrderByCompletedAtDesc(sessionId).stream()
                .anyMatch(activity -> activity.getUser().getId().equals(user.getId()));
    }
}
