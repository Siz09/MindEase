package com.mindease.controller;

import com.mindease.dto.JournalRequest;
import com.mindease.model.JournalEntry;
import com.mindease.service.JournalService;
import com.mindease.service.UserService;
import com.mindease.util.AuthUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.mindease.aop.annotations.AuditJournalAdded;

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
    @PostMapping({"/add", "", "/"})
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

            // Save journal entry
            JournalEntry savedEntry = journalService.saveJournalEntry(userId, title, content);

            response.put("success", true);
            response.put("message", "Journal entry saved successfully");
            response.put("entry", savedEntry);
            response.put("aiProcessing", true);
            response.put("aiAvailable", journalService.isAIAvailable());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error saving journal entry");
            response.put("details", e.getMessage());
            logger.error("Error saving journal entry for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError().body(response);
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

        } catch (Exception e) {
            logger.error("Error retrieving journal history for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError().body("Error retrieving journal history: " + e.getMessage());
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
            logger.error("Error retrieving recent journal entries for user: {}", authentication.getName(), e);
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
            logger.error("Error retrieving journal entry count for user: {}", authentication.getName(), e);
            return ResponseEntity.internalServerError().body("Error retrieving journal count: " + e.getMessage());
        }
    }

    private UUID getUserIdFromAuthentication(Authentication authentication) {
        return authUtil.getCurrentUserId();
    }
}
