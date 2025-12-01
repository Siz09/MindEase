package com.mindease.controller;

import com.mindease.model.MindfulnessSession;
import com.mindease.model.MindfulnessSessionActivity;
import com.mindease.model.User;
import com.mindease.model.UserMindfulnessPreferences;
import com.mindease.repository.UserMindfulnessPreferencesRepository;
import com.mindease.repository.UserRepository;
import com.mindease.security.CurrentUserId;
import com.mindease.service.MindfulnessActivityService;
import com.mindease.service.MindfulnessRecommendationService;
import com.mindease.service.MindfulnessService;
import com.mindease.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/mindfulness")
public class MindfulnessController {

    @Autowired
    private MindfulnessService mindfulnessService;

    @Autowired
    private MindfulnessActivityService activityService;

    @Autowired
    private MindfulnessRecommendationService recommendationService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserMindfulnessPreferencesRepository preferencesRepository;

    @GetMapping("/list")
    public ResponseEntity<?> getAllSessions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Integer maxDuration) {

        try {
            List<MindfulnessSession> sessions;

            if (type != null) {
                sessions = mindfulnessService.getSessionsByType(type);
            } else if (category != null) {
                sessions = mindfulnessService.getSessionsByCategory(category);
            } else if (difficulty != null) {
                sessions = mindfulnessService.getSessionsByDifficulty(difficulty);
            } else if (maxDuration != null) {
                sessions = mindfulnessService.getQuickSessions(maxDuration);
            } else {
                sessions = mindfulnessService.getAllSessions();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sessions", sessions);
            response.put("count", sessions.size());
            response.put("categories", mindfulnessService.getAllCategories());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving mindfulness sessions: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSessionById(@PathVariable String id) {
        try {
            UUID sessionId;
            try {
                sessionId = UUID.fromString(id);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid session ID format");
            }

            Optional<MindfulnessSession> session = mindfulnessService.getSessionById(sessionId);

            if (session.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("session", session.get());

                // Add media URL for streaming
                Map<String, String> mediaInfo = new HashMap<>();
                mediaInfo.put("url", session.get().getMediaUrl());
                mediaInfo.put("type", session.get().getType());
                mediaInfo.put("duration", session.get().getDuration() + " minutes");
                response.put("media", mediaInfo);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving mindfulness session: " + e.getMessage());
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getAllCategories() {
        try {
            List<String> categories = mindfulnessService.getAllCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("categories", categories);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving categories: " + e.getMessage());
        }
    }

    @GetMapping("/quick")
    public ResponseEntity<?> getQuickSessions(@RequestParam(defaultValue = "5") int maxDuration) {
        try {
            List<MindfulnessSession> quickSessions = mindfulnessService.getQuickSessions(maxDuration);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sessions", quickSessions);
            response.put("maxDuration", maxDuration);
            response.put("count", quickSessions.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving quick sessions: " + e.getMessage());
        }
    }

    // POST /api/mindfulness/sessions/{id}/complete - Record session completion
    @PostMapping("/sessions/{id}/complete")
    public ResponseEntity<?> recordCompletion(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> request) {
        try {
            UUID sessionId = UUID.fromString(id);
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Integer durationMinutes = extractInteger(request, "durationMinutes");
            Integer rating = extractInteger(request, "rating");
            Integer moodBefore = extractInteger(request, "moodBefore");
            Integer moodAfter = extractInteger(request, "moodAfter");

            MindfulnessSessionActivity activity = activityService.recordCompletion(
                    user, sessionId, durationMinutes, rating, moodBefore, moodAfter);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Session completion recorded");
            response.put("activity", activity);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error recording completion: " + e.getMessage()));
        }
    }

    // GET /api/mindfulness/analytics - Get user statistics
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(required = false, defaultValue = "30") int days) {
        try {
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            LocalDateTime since = LocalDateTime.now().minusDays(days);
            Long totalMinutes = activityService.getTotalMinutes(user, since);
            Map<String, Object> streak = activityService.getUserStreak(user);
            List<MindfulnessSessionActivity> recentActivities = activityService.getSessionHistory(user, 10);

            // Get actual total session count in the time window
            Long actualTotalSessions = activityService.countSessionsBetween(user, since, LocalDateTime.now());

            // Convert activities to maps for safe serialization
            List<Map<String, Object>> activitiesData = recentActivities.stream()
                    .map(activity -> {
                        Map<String, Object> activityMap = new HashMap<>();
                        activityMap.put("id", activity.getId());
                        activityMap.put("completedAt", activity.getCompletedAt());
                        activityMap.put("durationMinutes", activity.getDurationMinutes());
                        activityMap.put("rating", activity.getRating());
                        activityMap.put("moodBefore", activity.getMoodBefore());
                        activityMap.put("moodAfter", activity.getMoodAfter());
                        if (activity.getSession() != null) {
                            Map<String, Object> sessionMap = new HashMap<>();
                            sessionMap.put("id", activity.getSession().getId());
                            sessionMap.put("title", activity.getSession().getTitle());
                            sessionMap.put("category", activity.getSession().getCategory());
                            activityMap.put("session", sessionMap);
                        }
                        return activityMap;
                    })
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("totalMinutes", totalMinutes);
            response.put("totalSessions", actualTotalSessions != null ? actualTotalSessions : 0L);
            response.put("streak", streak);
            long totalSessionsCount = actualTotalSessions != null ? actualTotalSessions : 0L;
            response.put("averageMinutesPerSession", (totalSessionsCount == 0 || totalMinutes == null || totalMinutes == 0) ? 0
                    : Math.round((double) totalMinutes / totalSessionsCount));
            response.put("recentActivities", activitiesData);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error retrieving analytics: " + e.getMessage()));
        }
    }

    // GET /api/mindfulness/recommendations - Get personalized recommendations
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations() {
        try {
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Map<String, List<MindfulnessSession>> recommendations =
                    recommendationService.getRecommendations(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("recommendations", recommendations);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error retrieving recommendations: " + e.getMessage()));
        }
    }

    // POST /api/mindfulness/sessions/{id}/favorite - Toggle favorite
    @PostMapping("/sessions/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable String id) {
        try {
            UUID sessionId = UUID.fromString(id);
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            UserMindfulnessPreferences preferences = preferencesRepository.findByUser(user)
                    .orElseGet(() -> {
                        UserMindfulnessPreferences newPrefs = new UserMindfulnessPreferences(user);
                        return preferencesRepository.save(newPrefs);
                    });

            List<UUID> favorites = preferences.getFavoriteSessionIds();
            boolean isFavorite = favorites.contains(sessionId);

            if (isFavorite) {
                favorites.remove(sessionId);
            } else {
                favorites.add(sessionId);
            }

            preferencesRepository.save(preferences);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", isFavorite ? "Removed from favorites" : "Added to favorites");
            response.put("isFavorite", !isFavorite);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error toggling favorite: " + e.getMessage()));
        }
    }

    // GET /api/mindfulness/streak - Get current streak information
    @GetMapping("/streak")
    public ResponseEntity<?> getStreak() {
        try {
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Map<String, Object> streak = activityService.getUserStreak(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("streak", streak);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error retrieving streak: " + e.getMessage()));
        }
    }

    // GET /api/mindfulness/history - Get session history
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestParam(required = false, defaultValue = "20") int limit) {
        try {
            UUID userId;
            try {
                userId = CurrentUserId.get();
            } catch (IllegalStateException e) {
                return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
            }
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            List<MindfulnessSessionActivity> history = activityService.getSessionHistory(user, limit);

            // Convert activities to maps for safe serialization
            List<Map<String, Object>> historyData = history.stream()
                    .map(activity -> {
                        Map<String, Object> activityMap = new HashMap<>();
                        activityMap.put("id", activity.getId());
                        activityMap.put("completedAt", activity.getCompletedAt());
                        activityMap.put("durationMinutes", activity.getDurationMinutes());
                        activityMap.put("rating", activity.getRating());
                        activityMap.put("moodBefore", activity.getMoodBefore());
                        activityMap.put("moodAfter", activity.getMoodAfter());
                        if (activity.getSession() != null) {
                            Map<String, Object> sessionMap = new HashMap<>();
                            sessionMap.put("id", activity.getSession().getId());
                            sessionMap.put("title", activity.getSession().getTitle());
                            sessionMap.put("category", activity.getSession().getCategory());
                            sessionMap.put("type", activity.getSession().getType());
                            sessionMap.put("duration", activity.getSession().getDuration());
                            activityMap.put("session", sessionMap);
                        }
                        return activityMap;
                    })
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("history", historyData);
            response.put("count", history.size());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Error retrieving history: " + e.getMessage()));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        return error;
    }

    /**
     * Safely extract an Integer value from a Map, handling null values and type conversions.
     *
     * @param map The map to extract from
     * @param key The key to look up
     * @return The integer value, or null if key is absent, value is null, or value is not a Number
     * @throws IllegalArgumentException if the value exists but is not a Number
     */
    private Integer extractInteger(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) {
            return null;
        }
        Object value = map.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        throw new IllegalArgumentException("Value for key '" + key + "' must be a number, got: " + value.getClass().getSimpleName());
    }
}
