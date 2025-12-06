package com.mindease.mood.controller;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.auth.service.UserService;
import com.mindease.chat.model.ChatSession;
import com.mindease.chat.repository.ChatSessionRepository;
import com.mindease.mood.dto.MoodCheckInRequest;
import com.mindease.mood.dto.MoodCheckInResponse;
import com.mindease.mood.dto.UnifiedMoodRecord;
import com.mindease.mood.model.MoodCheckIn;
import com.mindease.mood.model.MoodEntry;
import com.mindease.mood.service.MoodPredictionService;
import com.mindease.mood.service.MoodService;
import com.mindease.shared.aop.annotations.AuditMoodAdded;
import com.mindease.shared.security.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mood")
@Tag(name = "Mood Tracking", description = "Mood tracking, check-ins, and prediction endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class MoodController {

    private static final Logger log = LoggerFactory.getLogger(MoodController.class);

    @Autowired
    private MoodService moodService;

    @Autowired
    private MoodPredictionService moodPredictionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    // ---- MoodEntry endpoints (from original MoodController) ----

    @Operation(summary = "Add a mood entry", description = "Add a new mood entry for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Mood entry added successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid mood value or user not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @PostMapping({"/add", "/checkin"})
    @AuditMoodAdded
    public ResponseEntity<?> addMoodEntry(@RequestBody MoodEntryRequest request, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            userService.trackUserActivityAsync(user);

            if (request.getMoodValue() < 1 || request.getMoodValue() > 10) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Mood value must be between 1 and 10"));
            }

            MoodEntry moodEntry = moodService.saveMoodEntry(user, request.getMoodValue(), request.getNotes());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Mood entry added successfully");
            response.put("status", "success");
            response.put("data", moodEntry);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to add mood entry: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getMoodHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<MoodEntry> moodEntriesPage = moodService.getMoodHistory(user, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", moodEntriesPage.getContent());
            response.put("currentPage", moodEntriesPage.getNumber());
            response.put("totalItems", moodEntriesPage.getTotalElements());
            response.put("totalPages", moodEntriesPage.getTotalPages());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to fetch mood history: " + e.getMessage()));
        }
    }

    @Operation(
            summary = "Get unified mood history",
            description = "Get mood history combining both MoodEntry (1-10) and MoodCheckIn (1-5) data, normalized to 1-10 scale")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Unified mood history retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @GetMapping("/unified")
    public ResponseEntity<?> getUnifiedMoodHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "30") int days) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            List<UnifiedMoodRecord> unifiedHistory = moodService.getUnifiedMoodHistory(user, days);
            Map<String, Double> trend = moodService.getUnifiedMoodTrend(user, days);
            Double averageMood = moodService.getAverageUnifiedMood(user, days);
            Map<String, Long> countBySource = moodService.getMoodCountBySource(user, days);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", unifiedHistory);
            response.put("trend", trend);
            response.put("averageMood", averageMood);
            response.put("countBySource", countBySource);
            response.put("days", days);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to fetch unified mood history: " + e.getMessage()));
        }
    }

    // ---- Mood check-in endpoints (from MoodTrackingController) ----

    @PostMapping("/checkins")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create mood check-in", description = "Record a mood check-in (1-5 scale)")
    public ResponseEntity<?> createCheckIn(Authentication authentication,
                                           @Valid @RequestBody MoodCheckInRequest request) {
        try {
            UUID userId = CurrentUserId.get();
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            ChatSession session = null;
            if (request.getSessionId() != null) {
                session = chatSessionRepository.findById(request.getSessionId()).orElse(null);
                if (session != null && !session.getUser().getId().equals(userId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Session does not belong to user");
                }
            }

            MoodCheckIn checkIn = moodService.createCheckIn(
                    user,
                    request.getScore(),
                    request.getTags(),
                    request.getCheckinType(),
                    session);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new MoodCheckInResponse(checkIn));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid mood check-in request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating mood check-in: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create mood check-in");
        }
    }

    @GetMapping("/checkins")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get recent check-ins", description = "Get user's mood check-ins for the last N days")
    public ResponseEntity<?> getRecentCheckIns(Authentication authentication,
                                               @RequestParam(defaultValue = "30") int days) {
        try {
            UUID userId = CurrentUserId.get();
            if (days < 1 || days > 365) {
                return ResponseEntity.badRequest().body("Days must be between 1 and 365");
            }

            List<MoodCheckIn> checkIns = moodService.getRecentCheckIns(userId, days);
            List<MoodCheckInResponse> responses = checkIns.stream()
                    .map(MoodCheckInResponse::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("Error fetching mood check-ins: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch mood check-ins");
        }
    }

    @GetMapping("/checkins/latest")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get latest check-in", description = "Get user's most recent mood check-in")
    public ResponseEntity<?> getLatestCheckIn(Authentication authentication) {
        try {
            UUID userId = CurrentUserId.get();
            MoodCheckIn latest = moodService.getLastCheckIn(userId);

            if (latest == null) {
                return ResponseEntity.ok().body(null);
            }

            return ResponseEntity.ok(new MoodCheckInResponse(latest));

        } catch (Exception e) {
            log.error("Error fetching latest mood check-in: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch latest mood check-in");
        }
    }

    // ---- Mood prediction endpoint (from MoodPredictionController) ----

    @GetMapping("/prediction")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get mood prediction",
            description = "Analyze recent mood history to predict future mood and provide insights")
    public ResponseEntity<Map<String, Object>> getPrediction(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Map<String, Object> prediction = moodPredictionService.predictMood(user);
        return ResponseEntity.ok(prediction);
    }

    // ---- Helpers ----

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("status", "error");
        return response;
    }

    public static class MoodEntryRequest {
        private Integer moodValue;
        private String notes;

        public Integer getMoodValue() {
            return moodValue;
        }

        public void setMoodValue(Integer moodValue) {
            this.moodValue = moodValue;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}

