package com.mindease.controller;

import com.mindease.model.MindfulnessSession;
import com.mindease.service.MindfulnessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
}