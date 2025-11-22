package com.mindease.controller;

import com.mindease.dto.MoodCheckInRequest;
import com.mindease.dto.MoodCheckInResponse;
import com.mindease.model.ChatSession;
import com.mindease.model.MoodCheckIn;
import com.mindease.model.User;
import com.mindease.repository.ChatSessionRepository;
import com.mindease.security.CurrentUserId;
import com.mindease.service.MoodTrackingService;
import com.mindease.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller for mood tracking features.
 * Allows users to record mood check-ins and view mood trends.
 */
@RestController
@RequestMapping("/api/mood")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Mood Tracking", description = "Mood check-in and trend analysis endpoints")
public class MoodTrackingController {

    private static final Logger log = LoggerFactory.getLogger(MoodTrackingController.class);

    @Autowired
    private MoodTrackingService moodTrackingService;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    /**
     * Create a new mood check-in.
     * POST /api/mood/checkins
     */
    @PostMapping("/checkins")
    @Operation(summary = "Create mood check-in", description = "Record a mood check-in (1-5 scale)")
    public ResponseEntity<?> createCheckIn(Authentication authentication,
            @Valid @RequestBody MoodCheckInRequest request) {
        try {
            UUID userId = com.mindease.security.CurrentUserId.get();
            User user = userService.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Get session if provided
            ChatSession session = null;
            if (request.getSessionId() != null) {
                session = chatSessionRepository.findById(request.getSessionId())
                        .orElse(null);
                // Verify session belongs to user
                if (session != null && !session.getUser().getId().equals(userId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Session does not belong to user");
                }
            }

            MoodCheckIn checkIn = moodTrackingService.createCheckIn(
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

    /**
     * Get recent mood check-ins for the current user.
     * GET /api/mood/checkins?days=30
     */
    @GetMapping("/checkins")
    @Operation(summary = "Get recent check-ins", description = "Get user's mood check-ins for the last N days")
    public ResponseEntity<?> getRecentCheckIns(Authentication authentication,
            @RequestParam(defaultValue = "30") int days) {
        try {
            UUID userId = com.mindease.security.CurrentUserId.get();
            if (days < 1 || days > 365) {
                return ResponseEntity.badRequest().body("Days must be between 1 and 365");
            }

            List<MoodCheckIn> checkIns = moodTrackingService.getRecentCheckIns(userId, days);
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

    /**
     * Get the most recent mood check-in.
     * GET /api/mood/checkins/latest
     */
    @GetMapping("/checkins/latest")
    @Operation(summary = "Get latest check-in", description = "Get user's most recent mood check-in")
    public ResponseEntity<?> getLatestCheckIn(Authentication authentication) {
        try {
            UUID userId = com.mindease.security.CurrentUserId.get();
            MoodCheckIn latest = moodTrackingService.getLastCheckIn(userId);

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
}
