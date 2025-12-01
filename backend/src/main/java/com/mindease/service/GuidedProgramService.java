package com.mindease.service;

import com.mindease.model.GuidedProgram;
import com.mindease.model.GuidedSession;
import com.mindease.model.GuidedStep;
import com.mindease.repository.GuidedProgramRepository;
import com.mindease.repository.GuidedSessionRepository;
import com.mindease.repository.GuidedStepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class GuidedProgramService {

    @Autowired
    private GuidedProgramRepository guidedProgramRepository;

    @Autowired
    private GuidedStepRepository guidedStepRepository;

    @Autowired
    private GuidedSessionRepository guidedSessionRepository;

    public List<GuidedProgram> getAllActivePrograms() {
        return guidedProgramRepository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    public Optional<GuidedProgram> getProgramById(UUID id) {
        return guidedProgramRepository.findById(id);
    }

    public List<GuidedStep> getProgramSteps(UUID programId) {
        return guidedStepRepository.findByProgramIdOrderByStepNumberAsc(programId);
    }

    @Transactional
    public GuidedSession startSession(UUID userId, UUID programId) {
        GuidedSession session = new GuidedSession();
        session.setUserId(userId);
        session.setProgramId(programId);
        session.setCurrentStepNumber(1);
        session.setStatus("in_progress");
        session.setResponses(new HashMap<>());
        return guidedSessionRepository.save(session);
    }

    public Optional<GuidedSession> getSessionById(UUID sessionId) {
        return guidedSessionRepository.findById(sessionId);
    }

    @Transactional
    public GuidedSession updateSessionStep(UUID sessionId, Integer stepNumber, Map<String, Object> responseData) {
        GuidedSession session = guidedSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Update responses if provided
        if (responseData != null) {
            Map<String, Object> currentResponses = session.getResponses();
            if (currentResponses == null) {
                currentResponses = new HashMap<>();
            }
            // Store response keyed by step number
            currentResponses.put(String.valueOf(stepNumber), responseData);
            session.setResponses(currentResponses);
        }

        // Check if this was the last step or if we should move to next
        List<GuidedStep> steps = guidedStepRepository.findByProgramIdOrderByStepNumberAsc(session.getProgramId());
        int totalSteps = steps.size();

        if (stepNumber >= totalSteps) {
            session.setStatus("completed");
            session.setCompletedAt(LocalDateTime.now());
            session.setCurrentStepNumber(totalSteps); // Stay on last step
        } else {
            session.setCurrentStepNumber(stepNumber + 1);
        }

        return guidedSessionRepository.save(session);
    }

    public List<GuidedSession> getUserSessions(UUID userId) {
        return guidedSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
    }
}
