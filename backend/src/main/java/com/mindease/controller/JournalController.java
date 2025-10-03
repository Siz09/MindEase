package com.mindease.controller;

import com.mindease.dto.JournalRequest;
import com.mindease.model.JournalEntry;
import com.mindease.service.CustomUserDetails;
import com.mindease.service.JournalService;
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


  @PostMapping("/add")
  public ResponseEntity<Map<String, Object>> addJournalEntry(
    @RequestBody JournalRequest request,
    Authentication authentication) {
    
    Map<String, Object> response = new HashMap<>();
    try {
      String content = request.getContent();
      if (content == null || content.trim().isEmpty()) {
        response.put("success", false);
        response.put("message", "Journal content cannot be empty");
        return ResponseEntity.badRequest().body(response);
      }

      // Get user ID from authentication
      UUID userId = getUserIdFromAuthentication(authentication);
      
      JournalEntry savedEntry = journalService.saveJournalEntry(userId, content);
      
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
      return ResponseEntity.internalServerError().body(response);
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
    if (authentication != null && authentication.isAuthenticated()) {
      // Get the principal (user details)
      Object principal = authentication.getPrincipal();
      
      // If it's a CustomUserDetails, extract the user ID
      if (principal instanceof CustomUserDetails) {
        return ((CustomUserDetails) principal).getId();
      }
      
      // If it's just a username string, we need to look up the user
      if (principal instanceof String) {
        String username = (String) principal;
        // For now, we'll need to look up the user by username/email
        // This is a temporary fix - you should store user ID in the JWT token
        throw new RuntimeException("Cannot extract user ID from username: " + username);
      }
    }
    throw new RuntimeException("User not authenticated");
  }
}
