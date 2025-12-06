package com.mindease.mindfulness.service;

import com.mindease.auth.model.User;
import com.mindease.mindfulness.model.MindfulnessSession;
import com.mindease.mindfulness.model.MindfulnessSessionActivity;
import com.mindease.mindfulness.repository.MindfulnessSessionActivityRepository;
import com.mindease.mindfulness.repository.MindfulnessSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class MindfulnessService {

    @Autowired
    private MindfulnessSessionRepository mindfulnessSessionRepository;

    @Autowired
    private MindfulnessSessionActivityRepository activityRepository;

    // --- Session catalog operations ---

    public List<MindfulnessSession> getAllSessions() {
        return mindfulnessSessionRepository.findAllByOrderByDurationAsc();
    }

    public List<MindfulnessSession> getSessionsByType(String type) {
        return mindfulnessSessionRepository.findByTypeOrderByDurationAsc(type);
    }

    public List<MindfulnessSession> getSessionsByCategory(String category) {
        return mindfulnessSessionRepository.findByCategoryOrderByDurationAsc(category);
    }

    public List<MindfulnessSession> getSessionsByDifficulty(String difficultyLevel) {
        return mindfulnessSessionRepository.findByDifficultyLevelOrderByDurationAsc(difficultyLevel);
    }

    public Optional<MindfulnessSession> getSessionById(UUID id) {
        return mindfulnessSessionRepository.findById(id);
    }

    public List<String> getAllCategories() {
        return mindfulnessSessionRepository.findDistinctCategories();
    }

    public List<MindfulnessSession> getQuickSessions(int maxDuration) {
        return mindfulnessSessionRepository.findAllByOrderByDurationAsc()
                .stream()
                .filter(session -> session.getDuration() <= maxDuration)
                .toList();
    }

    // --- Activity tracking operations (merged from MindfulnessActivityService) ---

    public MindfulnessSessionActivity recordCompletion(
            User user, UUID sessionId, Integer durationMinutes, Integer rating,
            Integer moodBefore, Integer moodAfter) {

        MindfulnessSession session = mindfulnessSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        MindfulnessSessionActivity activity = new MindfulnessSessionActivity(user, session, LocalDateTime.now());
        activity.setDurationMinutes(durationMinutes != null ? durationMinutes : session.getDuration());
        activity.setRating(rating);
        activity.setMoodBefore(moodBefore);
        activity.setMoodAfter(moodAfter);

        return activityRepository.save(activity);
    }

    public Map<String, Object> getUserStreak(User user) {
        List<MindfulnessSessionActivity> allActivities = activityRepository.findByUserOrderByCompletedAtDesc(user);

        if (allActivities.isEmpty()) {
            return Map.of(
                    "currentStreak", 0,
                    "longestStreak", 0,
                    "isActive", false);
        }

        int currentStreak = 0;
        LocalDate today = LocalDate.now();
        LocalDate checkDate = today;
        boolean countingFromToday = true;

        while (true) {
            LocalDate finalCheckDate = checkDate;
            boolean hasSessionOnDate = allActivities.stream()
                    .anyMatch(activity -> activity.getCompletedAt().toLocalDate().equals(finalCheckDate));

            if (hasSessionOnDate) {
                currentStreak++;
                countingFromToday = false;
                checkDate = checkDate.minusDays(1);
            } else if (countingFromToday && checkDate.equals(today)) {
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }

            if (checkDate.isBefore(today.minusYears(1))) {
                break;
            }
        }

        int longestStreak = calculateLongestStreak(allActivities);

        return Map.of(
                "currentStreak", currentStreak,
                "longestStreak", longestStreak,
                "isActive", currentStreak > 0);
    }

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
                continue;
            } else if (activityDate.equals(previousDate.minusDays(1))) {
                currentStreak++;
                previousDate = activityDate;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
                previousDate = activityDate;
            }
        }

        return Math.max(maxStreak, currentStreak);
    }

    public Long getTotalMinutes(User user, LocalDateTime since) {
        Long total = activityRepository.sumDurationMinutesByUserSince(user, since);
        return total != null ? total : 0L;
    }

    public List<UUID> getFavoriteSessions(User user, int limit) {
        List<Object[]> favorites = activityRepository.findFavoriteSessionsByUser(user);
        return favorites.stream()
                .limit(limit)
                .map(result -> (UUID) result[0])
                .collect(Collectors.toList());
    }

    public List<MindfulnessSessionActivity> getSessionHistory(User user, int limit) {
        return activityRepository.findByUserOrderByCompletedAtDesc(user).stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<MindfulnessSessionActivity> getActivitiesInRange(
            User user, LocalDateTime start, LocalDateTime end) {
        return activityRepository.findByUserAndCompletedAtBetween(user, start, end);
    }

    public Long countSessionsBetween(User user, LocalDateTime start, LocalDateTime end) {
        return activityRepository.countByUserAndCompletedAtBetween(user, start, end);
    }

    public boolean hasCompletedSession(User user, UUID sessionId) {
        return activityRepository.existsByUserAndSessionId(user, sessionId);
    }
}
