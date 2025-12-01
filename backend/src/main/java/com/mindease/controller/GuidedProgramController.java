package com.mindease.controller;

import com.mindease.exception.AccessDeniedException;
import com.mindease.exception.ProgramNotFoundException;
import com.mindease.exception.SessionNotFoundException;
import com.mindease.exception.UnauthenticatedException;
import com.mindease.model.GuidedProgram;
import com.mindease.model.GuidedSession;
import com.mindease.model.GuidedStep;
import com.mindease.service.GuidedProgramService;
import com.mindease.security.CurrentUserId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/guided-programs")
public class GuidedProgramController {

    private static final Logger logger = LoggerFactory.getLogger(GuidedProgramController.class);

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
            logger.error("Error fetching programs", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred while fetching programs.");
            return ResponseEntity.internalServerError().body(errorResponse);
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
            logger.error("Error fetching steps", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Error fetching steps"));
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
        } catch (UnauthenticatedException e) {
            return ResponseEntity.status(401).body(createErrorResponse("User not authenticated"));
        } catch (ProgramNotFoundException e) {
            return ResponseEntity.status(404).body(createErrorResponse("Program not found: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error starting session", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Error starting session"));
        }
    }

    @PostMapping("/session/{sessionId}/step")
    public ResponseEntity<?> submitStepResponse(
            @PathVariable UUID sessionId,
            @RequestBody Map<String, Object> payload) {
        try {
            // Validate payload
            if (payload == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Request body is required"));
            }

            if (!payload.containsKey("stepNumber")) {
                return ResponseEntity.badRequest().body(createErrorResponse("stepNumber is required"));
            }

            if (!payload.containsKey("response")) {
                return ResponseEntity.badRequest().body(createErrorResponse("response is required"));
            }

            // Validate and convert stepNumber
            Object stepNumberObj = payload.get("stepNumber");
            if (!(stepNumberObj instanceof Number)) {
                return ResponseEntity.badRequest().body(createErrorResponse("stepNumber must be a number"));
            }
            Integer stepNumber = ((Number) stepNumberObj).intValue();

            // Validate response
            Object responseObj = payload.get("response");
            if (!(responseObj instanceof Map)) {
                return ResponseEntity.badRequest().body(createErrorResponse("response must be an object"));
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> responseData = (Map<String, Object>) responseObj;

            UUID userId = CurrentUserId.get();
            GuidedSession session = guidedProgramService.updateSessionStep(userId, sessionId, stepNumber, responseData);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("session", session);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (SessionNotFoundException e) {
            return ResponseEntity.status(404).body(createErrorResponse(e.getMessage()));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating session", e);
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("An unexpected error occurred while updating session."));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        return error;
    }

    private boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                && !"anonymousUser".equals(authentication.getPrincipal());
    }
}
