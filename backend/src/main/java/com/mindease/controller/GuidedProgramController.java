package com.mindease.controller;

import com.mindease.model.GuidedProgram;
import com.mindease.model.GuidedSession;
import com.mindease.model.GuidedStep;
import com.mindease.service.GuidedProgramService;
import com.mindease.security.CurrentUserId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/guided-programs")
public class GuidedProgramController {

    @Autowired
    private GuidedProgramService guidedProgramService;

    @GetMapping
    public ResponseEntity<?> getAllPrograms() {
        try {
            List<GuidedProgram> programs = guidedProgramService.getAllActivePrograms();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("programs", programs);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error fetching programs: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProgramById(@PathVariable UUID id) {
        Optional<GuidedProgram> program = guidedProgramService.getProgramById(id);
        if (program.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("program", program.get());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/steps")
    public ResponseEntity<?> getProgramSteps(@PathVariable UUID id) {
        try {
            List<GuidedStep> steps = guidedProgramService.getProgramSteps(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("steps", steps);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error fetching steps: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> startSession(@PathVariable UUID id) {
        try {
            UUID userId = CurrentUserId.get();
            GuidedSession session = guidedProgramService.startSession(userId, id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("session", session);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body("User not authenticated");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error starting session: " + e.getMessage());
        }
    }

    @PostMapping("/session/{sessionId}/step")
    public ResponseEntity<?> submitStepResponse(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> payload) {
        try {
            Integer stepNumber = (Integer) payload.get("stepNumber");
            @SuppressWarnings("unchecked")
            Map<String, Object> responseData = (Map<String, Object>) payload.get("response");

            GuidedSession session = guidedProgramService.updateSessionStep(sessionId, stepNumber, responseData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("session", session);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating session: " + e.getMessage());
        }
    }
}
