package com.mindease.controller;

import com.mindease.service.AutoMoodService;
import com.mindease.service.InactivityDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dev")
public class DevController {

  @Value("${spring.profiles.active:}")
  private String activeProfile;

  @Autowired
  private AutoMoodService autoMoodService;

  @Autowired
  private InactivityDetectionService inactivityDetectionService;

  @GetMapping("/profile")
  public Map<String, String> getActiveProfile() {
    Map<String, String> response = new HashMap<>();
    response.put("activeProfile", activeProfile);
    response.put("status", "success");
    return response;
  }

  @PostMapping("/trigger-auto-mood")
  public ResponseEntity<?> triggerAutoMood() {
    if (!isDevelopmentMode()) {
      return ResponseEntity.badRequest().body(createErrorResponse("This endpoint is only available in development mode"));
    }

    try {
      autoMoodService.manualTrigger();
      return ResponseEntity.ok("Auto mood task triggered manually");
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to trigger auto mood: " + e.getMessage()));
    }
  }

  @PostMapping("/trigger-inactivity-detection")
  public ResponseEntity<?> triggerInactivityDetection() {
    if (!isDevelopmentMode()) {
      return ResponseEntity.badRequest().body(createErrorResponse("This endpoint is only available in development mode"));
    }

    try {
      inactivityDetectionService.manualTrigger();
      return ResponseEntity.ok("Inactivity detection task triggered manually");
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to trigger inactivity detection: " + e.getMessage()));
    }
  }

  @GetMapping("/health")
  public Map<String, String> healthCheck() {
    Map<String, String> response = new HashMap<>();
    response.put("status", "healthy");
    response.put("profile", activeProfile);
    response.put("timestamp", java.time.LocalDateTime.now().toString());
    return response;
  }

  private boolean isDevelopmentMode() {
    return "dev".equals(activeProfile) || activeProfile.contains("development");
  }

  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> response = new HashMap<>();
    response.put("message", message);
    response.put("status", "error");
    return response;
  }
}
