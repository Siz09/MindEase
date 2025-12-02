package com.mindease.service;

import com.mindease.model.MindfulnessSession;
import com.mindease.model.User;
import com.mindease.model.UserMindfulnessPreferences;
import com.mindease.repository.MindfulnessSessionActivityRepository;
import com.mindease.repository.MindfulnessSessionRepository;
import com.mindease.repository.MoodEntryRepository;
import com.mindease.repository.UserMindfulnessPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class MindfulnessRecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(MindfulnessRecommendationService.class);

    @Autowired
    private MindfulnessSessionRepository sessionRepository;

    @Autowired
    private MindfulnessSessionActivityRepository activityRepository;

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private UserMindfulnessPreferencesRepository preferencesRepository;

    /**
     * Get personalized recommendations for a user
     */
    public Map<String, List<MindfulnessSession>> getRecommendations(User user) {
        Map<String, List<MindfulnessSession>> recommendations = new HashMap<>();

        try {
            // Get user preferences
            UserMindfulnessPreferences preferences = preferencesRepository.findByUser(user)
                    .orElse(new UserMindfulnessPreferences(user));

            // 1. Mood-based recommendations
            try {
                recommendations.put("moodBased", getMoodBasedRecommendations(user));
            } catch (Exception e) {
                logger.error("Failed to get mood-based recommendations for user {}", user.getId(), e);
                recommendations.put("moodBased", new ArrayList<>());
            }

            // 2. Continue your journey (difficulty progression)
            try {
                recommendations.put("continueJourney", getDifficultyProgressionRecommendations(user));
            } catch (Exception e) {
                logger.error("Failed to get difficulty progression recommendations for user {}", user.getId(), e);
                recommendations.put("continueJourney", new ArrayList<>());
            }

            // 3. Similar to completed sessions
            try {
                recommendations.put("similarSessions", getSimilarSessionRecommendations(user));
            } catch (Exception e) {
                logger.error("Failed to get similar session recommendations for user {}", user.getId(), e);
                recommendations.put("similarSessions", new ArrayList<>());
            }

            // 4. Time-based suggestions
            try {
                ZoneId userZone = getUserTimezone(user);
                recommendations.put("timeBased", getTimeBasedRecommendations(userZone));
            } catch (Exception e) {
                logger.error("Failed to get time-based recommendations for user {}", user.getId(), e);
                recommendations.put("timeBased", new ArrayList<>());
            }

            // 5. Recommended for you (based on preferences)
            try {
                recommendations.put("recommendedForYou", getPreferenceBasedRecommendations(preferences));
            } catch (Exception e) {
                logger.error("Failed to get preference-based recommendations for user {}", user.getId(), e);
                recommendations.put("recommendedForYou", new ArrayList<>());
            }
        } catch (Exception e) {
            logger.error("Failed to assemble recommendations for user {}", user.getId(), e);
            // Return empty recommendations if everything fails
            recommendations.put("moodBased", new ArrayList<>());
            recommendations.put("continueJourney", new ArrayList<>());
            recommendations.put("similarSessions", new ArrayList<>());
            recommendations.put("timeBased", new ArrayList<>());
            recommendations.put("recommendedForYou", new ArrayList<>());
        }

        return recommendations;
    }

    /**
     * Get recommendations based on current mood
     */
    private List<MindfulnessSession> getMoodBasedRecommendations(User user) {
        // Get most recent mood
        var recentMoods = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
        if (recentMoods.isEmpty()) {
            // Default recommendations if no mood data
            return sessionRepository.findByDifficultyLevelOrderByDurationAsc("beginner")
                    .stream().limit(5).collect(Collectors.toList());
        }

        int currentMood = recentMoods.get(0).getMoodValue();
        List<MindfulnessSession> recommendations = new ArrayList<>();

        try {
            if (currentMood <= 4) {
                // Low mood - suggest uplifting, energizing sessions
                List<MindfulnessSession> energizing = sessionRepository.findByCategoryOrderByDurationAsc("energizing");
                if (!energizing.isEmpty()) {
                    recommendations.addAll(energizing.stream().limit(3).collect(Collectors.toList()));
                }
                List<MindfulnessSession> breathing = sessionRepository.findByCategoryOrderByDurationAsc("breathing");
                if (!breathing.isEmpty()) {
                    recommendations.addAll(breathing.stream().limit(2).collect(Collectors.toList()));
                }
            } else if (currentMood <= 6) {
                // Neutral mood - suggest balanced sessions
                List<MindfulnessSession> beginner = sessionRepository
                        .findByDifficultyLevelOrderByDurationAsc("beginner");
                if (!beginner.isEmpty()) {
                    recommendations.addAll(beginner.stream().limit(3).collect(Collectors.toList()));
                }
                List<MindfulnessSession> relaxation = sessionRepository.findByCategoryOrderByDurationAsc("relaxation");
                if (!relaxation.isEmpty()) {
                    recommendations.addAll(relaxation.stream().limit(2).collect(Collectors.toList()));
                }
            } else {
                // High mood - suggest maintaining sessions
                List<MindfulnessSession> gratitude = sessionRepository.findByCategoryOrderByDurationAsc("gratitude");
                if (!gratitude.isEmpty()) {
                    recommendations.addAll(gratitude.stream().limit(3).collect(Collectors.toList()));
                }
                List<MindfulnessSession> mindfulness = sessionRepository
                        .findByCategoryOrderByDurationAsc("mindfulness");
                if (!mindfulness.isEmpty()) {
                    recommendations.addAll(mindfulness.stream().limit(2).collect(Collectors.toList()));
                }
            }
        } catch (Exception e) {
            // If category queries fail, fall back to beginner sessions
            List<MindfulnessSession> beginner = sessionRepository.findByDifficultyLevelOrderByDurationAsc("beginner");
            if (!beginner.isEmpty()) {
                recommendations.addAll(beginner.stream().limit(5).collect(Collectors.toList()));
            }
        }

        return recommendations.stream().distinct().limit(5).collect(Collectors.toList());
    }

    /**
     * Get recommendations based on difficulty progression
     */
    private List<MindfulnessSession> getDifficultyProgressionRecommendations(User user) {
        // Get completed sessions to determine current level
        var completedActivities = activityRepository.findByUserOrderByCompletedAtDesc(user);

        if (completedActivities.isEmpty()) {
            // Start with beginner sessions
            return sessionRepository.findByDifficultyLevelOrderByDurationAsc("beginner")
                    .stream().limit(5).collect(Collectors.toList());
        }

        // Find most common difficulty level
        String currentLevel = completedActivities.stream()
                .map(activity -> {
                    if (activity.getSession() == null)
                        return null;
                    return activity.getSession().getDifficultyLevel();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(level -> level, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("beginner");

        // Suggest next level
        String nextLevel = switch (currentLevel) {
            case "beginner" -> "intermediate";
            case "intermediate" -> "advanced";
            default -> "advanced";
        };

        return sessionRepository.findByDifficultyLevelOrderByDurationAsc(nextLevel)
                .stream().limit(5).collect(Collectors.toList());
    }

    /**
     * Get sessions similar to completed ones
     */
    private List<MindfulnessSession> getSimilarSessionRecommendations(User user) {
        var completedActivities = activityRepository.findByUserOrderByCompletedAtDesc(user);

        if (completedActivities.isEmpty()) {
            return new ArrayList<>();
        }

        // Get categories and types from completed sessions
        Set<String> preferredCategories = completedActivities.stream()
                .map(activity -> {
                    if (activity.getSession() == null)
                        return null;
                    return activity.getSession().getCategory();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> preferredTypes = completedActivities.stream()
                .map(activity -> {
                    if (activity.getSession() == null)
                        return null;
                    return activity.getSession().getType();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Get completed session IDs to exclude
        Set<UUID> completedSessionIds = completedActivities.stream()
                .map(activity -> {
                    if (activity.getSession() == null)
                        return null;
                    return activity.getSession().getId();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // TEMPORARILY DISABLED - findSimilarSessions has query issues
        // Fallback: return sessions from preferred category
        if (!preferredCategories.isEmpty()) {
            String category = preferredCategories.iterator().next();
            return sessionRepository.findByCategoryOrderByDurationAsc(category)
                    .stream()
                    .filter(session -> !completedSessionIds.contains(session.getId()))
                    .limit(5)
                    .collect(Collectors.toList());
        }
        return new ArrayList<>();
    }

    /**
     * Get user's timezone, defaulting to system default if not available
     */
    private ZoneId getUserTimezone(User user) {
        // Try to get timezone from user preferences or user model
        // For now, default to system default timezone
        // TODO: Add timezone field to User or UserMindfulnessPreferences if needed
        return ZoneId.systemDefault();
    }

    /**
     * Get time-based recommendations
     */
    private List<MindfulnessSession> getTimeBasedRecommendations(ZoneId userZone) {
        LocalTime now = LocalTime.now(userZone);
        List<MindfulnessSession> recommendations = new ArrayList<>();

        try {
            if (now.isAfter(LocalTime.of(5, 0)) && now.isBefore(LocalTime.of(12, 0))) {
                // Morning - energizing, short sessions
                List<MindfulnessSession> energizing = sessionRepository.findByCategoryOrderByDurationAsc("energizing");
                if (!energizing.isEmpty()) {
                    recommendations.addAll(energizing.stream()
                            .filter(s -> s.getDuration() != null && s.getDuration() <= 10)
                            .limit(3).collect(Collectors.toList()));
                }
                List<MindfulnessSession> morning = sessionRepository.findByCategoryOrderByDurationAsc("morning");
                if (!morning.isEmpty()) {
                    recommendations.addAll(morning.stream().limit(2).collect(Collectors.toList()));
                }
            } else if (now.isAfter(LocalTime.of(12, 0)) && now.isBefore(LocalTime.of(18, 0))) {
                // Afternoon - balanced sessions
                List<MindfulnessSession> mindfulness = sessionRepository
                        .findByCategoryOrderByDurationAsc("mindfulness");
                if (!mindfulness.isEmpty()) {
                    recommendations.addAll(mindfulness.stream()
                            .filter(s -> s.getDuration() != null && s.getDuration() <= 15)
                            .limit(5).collect(Collectors.toList()));
                }
            } else {
                // Evening - relaxation, wind-down sessions
                List<MindfulnessSession> relaxation = sessionRepository.findByCategoryOrderByDurationAsc("relaxation");
                if (!relaxation.isEmpty()) {
                    recommendations.addAll(relaxation.stream().limit(3).collect(Collectors.toList()));
                }
                List<MindfulnessSession> sleep = sessionRepository.findByCategoryOrderByDurationAsc("sleep");
                if (!sleep.isEmpty()) {
                    recommendations.addAll(sleep.stream().limit(2).collect(Collectors.toList()));
                }
            }
        } catch (Exception e) {
            // Fall back to any available sessions if time-based queries fail
            List<MindfulnessSession> allSessions = sessionRepository.findAllByOrderByDurationAsc();
            if (!allSessions.isEmpty()) {
                recommendations.addAll(allSessions.stream().limit(5).collect(Collectors.toList()));
            }
        }

        return recommendations.stream().distinct().limit(5).collect(Collectors.toList());
    }

    /**
     * Get recommendations based on user preferences
     */
    private List<MindfulnessSession> getPreferenceBasedRecommendations(UserMindfulnessPreferences preferences) {
        List<MindfulnessSession> recommendations = new ArrayList<>();

        // Based on preferred categories - null-safe check
        List<String> preferredCategories = preferences.getPreferredCategories();
        if (preferredCategories != null && !preferredCategories.isEmpty()) {
            preferredCategories.forEach(category -> {
                recommendations.addAll(sessionRepository.findByCategoryOrderByDurationAsc(category)
                        .stream().limit(2).collect(Collectors.toList()));
            });
        }

        // Based on preferred difficulty
        if (preferences.getPreferredDifficulty() != null) {
            recommendations.addAll(sessionRepository.findByDifficultyLevelOrderByDurationAsc(
                    preferences.getPreferredDifficulty())
                    .stream().limit(3).collect(Collectors.toList()));
        }

        return recommendations.stream().distinct().limit(5).collect(Collectors.toList());
    }
}
