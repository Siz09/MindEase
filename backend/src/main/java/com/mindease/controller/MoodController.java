package com.mindease.controller;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodEntryRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/mood")
@Tag(name = "Mood Tracking", description = "Mood tracking and history endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class MoodController {

  @Autowired
  private MoodEntryRepository moodEntryRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private UserService userService;

  // POST /api/mood/add - Add a new mood entry
  @Operation(summary = "Add a mood entry", description = "Add a new mood entry for the authenticated user")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Mood entry added successfully"),
    @ApiResponse(responseCode = "400", description = "Invalid mood value or user not found"),
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
  })
  @PostMapping("/add")
  public ResponseEntity<?> addMoodEntry(@RequestBody MoodEntryRequest request, Authentication authentication) {
    try {
      // Get the authenticated user's email
      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();

      // Track user activity (async - fire-and-forget)
      userService.trackUserActivityAsync(user);

      // Validate mood value (1-10)
      if (request.getMoodValue() < 1 || request.getMoodValue() > 10) {
        return ResponseEntity.badRequest().body(createErrorResponse("Mood value must be between 1 and 10"));
      }

      // Create and save the mood entry
      MoodEntry moodEntry = new MoodEntry(user, request.getMoodValue(), request.getNotes());
      moodEntryRepository.save(moodEntry);

      Map<String, Object> response = new HashMap<>();
      response.put("message", "Mood entry added successfully");
      response.put("status", "success");
      response.put("data", moodEntry);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to add mood entry: " + e.getMessage()));
    }
  }

  // GET /api/mood/history - Get paginated mood history for the authenticated user
  @GetMapping("/history")
  public ResponseEntity<?> getMoodHistory(
    Authentication authentication,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size) {
    try {
      // Get the authenticated user's email
      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();

      // Create pageable object with sort by createdAt descending
      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
      Page<MoodEntry> moodEntriesPage = moodEntryRepository.findByUserOrderByCreatedAtDesc(user, pageable);

      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("data", moodEntriesPage.getContent());
      response.put("currentPage", moodEntriesPage.getNumber());
      response.put("totalItems", moodEntriesPage.getTotalElements());
      response.put("totalPages", moodEntriesPage.getTotalPages());

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to fetch mood history: " + e.getMessage()));
    }
  }

  // Helper method to create error response
  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("message", message);
    response.put("status", "error");
    return response;
  }

  // Request DTO for adding a mood entry
  public static class MoodEntryRequest {
    private Integer moodValue;
    private String notes;

    // Getters and setters
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
