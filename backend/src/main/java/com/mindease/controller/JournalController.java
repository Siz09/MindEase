package com.mindease.controller;

import com.mindease.model.JournalEntry;
import com.mindease.service.JournalService;
import com.mindease.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

  @Autowired
  private JournalService journalService;

  @Autowired
  private AuthUtil authUtil;

  @PostMapping("/add")
  public ResponseEntity<?> addJournalEntry(
    @RequestBody Map<String, String> request,
    Authentication authentication) {
    
    try {
      String content = request.get("content");
      if (content == null || content.trim().isEmpty()) {
        return ResponseEntity.badRequest().body("Journal content cannot be empty");
      }

      // Get user ID from authentication
      UUID userId = getUserIdFromAuthentication(authentication);
      
      JournalEntry savedEntry = journalService.saveJournalEntry(userId, content.trim());
      
      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Journal entry saved successfully");
      response.put("entry", savedEntry);
      response.put("aiProcessing", true);
      response.put("aiAvailable", journalService.isAIAvailable());
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body("Error saving journal entry: " + e.getMessage());
    }
  }
  
  @GetMapping("/ai-status")
  public ResponseEntity<?> getAIStatus() {
    Map<String, Object> response = new HashMap<>();
    response.put("success", true);
    response.put("aiAvailable", journalService.isAIAvailable());
    response.put("message", journalService.isAIAvailable() ? 
        "AI features are available" : "AI features are not configured");
    
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
      return ResponseEntity.internalServerError().body("Error retrieving journal count: " + e.getMessage());
    }
  }

  private UUID getUserIdFromAuthentication(Authentication authentication) {
    return authUtil.getCurrentUserId();
  }
}
