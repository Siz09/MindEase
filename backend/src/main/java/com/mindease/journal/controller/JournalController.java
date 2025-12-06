package com.mindease.journal.controller;

import com.mindease.auth.service.UserService;
import com.mindease.journal.dto.JournalRequest;
import com.mindease.journal.model.JournalEntry;
import com.mindease.journal.service.JournalService;
import com.mindease.shared.exception.UnauthenticatedException;
import com.mindease.shared.util.AuthUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.mindease.shared.aop.annotations.AuditJournalAdded;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    private static final Logger logger = LoggerFactory.getLogger(JournalController.class);

    @Autowired
    private JournalService journalService;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthUtil authUtil;

    // Support both /add and root path for backwards compatibility
    @PostMapping({ "/add", "", "/" })
    @AuditJournalAdded
    public ResponseEntity<Map<String, Object>> addJournalEntry(
            @RequestBody JournalRequest request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        try {
            String content = request.getContent();
            String title = request.getTitle();
            if (content == null || content.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Journal content cannot be empty");
                return ResponseEntity.badRequest().body(response);
            }

            // Get user ID from authentication
            UUID userId = getUserIdFromAuthentication(authentication);

            // ✅ Track user activity asynchronously (fire-and-forget)
            try {
                userService.trackUserActivityAsync(userId);
            } catch (Exception ex) {
                logger.warn("Failed to track user activity for userId: {}", userId, ex);
            }

            // Extract mood value from request (optional)
            Integer moodValue = request.getMoodValue();

            // Save journal entry (with optional mood linking)
            JournalEntry savedEntry = journalService.saveJournalEntry(userId, title, content, moodValue);

            response.put("success", true);
            response.put("message", "Journal entry saved successfully");
            response.put("entry", savedEntry);
            response.put("aiProcessing", true);
            response.put("aiAvailable", journalService.isAIAvailable());

            return ResponseEntity.ok(response);

        } catch (UnauthenticatedException e) {
            // Re-throw to let global exception handler catch it and return 401
            throw e;
        } catch (IllegalArgumentException e) {
            // Handle validation errors as 400 Bad Request
            response.put("success", false);
            response.put("message", "Invalid request: " + e.getMessage());
            response.put("details", e.getMessage());
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.warn("Invalid journal entry request from user: {} - {}", username, e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (DataAccessException e) {
            // Handle database errors
            response.put("success", false);
            response.put("message", "Database error while saving journal entry");
            response.put("details", e.getMessage());
            response.put("errorType", "DataAccessException");
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.error("Database error saving journal entry for user: {}", username, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error saving journal entry");
            response.put("details", e.getMessage());
            response.put("errorType", e.getClass().getSimpleName());
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.error("Error saving journal entry for user: {} - Exception type: {}, Message: {}",
                    username, e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/ai-status")
    public ResponseEntity<?> getAIStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("aiAvailable", journalService.isAIAvailable());
        response.put("message",
                journalService.isAIAvailable() ? "AI features are available" : "AI features are not configured");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getJournalHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            UUID userId = getUserIdFromAuthentication(authentication);

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<JournalEntry> journalPage = journalService.getJournalHistory(userId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("entries", journalPage.getContent());
            response.put("currentPage", journalPage.getNumber());
            response.put("totalItems", journalPage.getTotalElements());
            response.put("totalPages", journalPage.getTotalPages());
            response.put("hasNext", journalPage.hasNext());
            response.put("hasPrevious", journalPage.hasPrevious());

            return ResponseEntity.ok(response);

        } catch (UnauthenticatedException e) {
            // Re-throw to let global exception handler catch it and return 401
            throw e;
        } catch (Exception e) {
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.error("Error retrieving journal history for user: {}", username, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error retrieving journal history");
            errorResponse.put("details", e.getMessage());
            errorResponse.put("errorType", e.getClass().getSimpleName());

            // Return 400 for client errors, 500 for server errors
            HttpStatus status = (e instanceof IllegalArgumentException)
                    ? HttpStatus.BAD_REQUEST
                    : HttpStatus.INTERNAL_SERVER_ERROR;

            return ResponseEntity.status(status).body(errorResponse);
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentJournalEntries(Authentication authentication) {
        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            var recentEntries = journalService.getRecentJournalEntries(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("entries", recentEntries);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.error("Error retrieving recent journal entries for user: {}", username, e);
            return ResponseEntity.internalServerError().body("Error retrieving recent entries: " + e.getMessage());
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> getJournalEntryCount(Authentication authentication) {
        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            long count = journalService.getJournalEntryCount(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            String username = authentication != null ? authentication.getName() : "unknown";
            logger.error("Error retrieving journal entry count for user: {}", username, e);
            return ResponseEntity.internalServerError().body("Error retrieving journal count: " + e.getMessage());
        }
    }

    private UUID getUserIdFromAuthentication(Authentication authentication) {
        return authUtil.getCurrentUserId();
    }
}
