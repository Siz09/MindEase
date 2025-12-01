package com.mindease.service;

import com.mindease.model.GuidedProgram;
import com.mindease.model.GuidedSession;
import com.mindease.model.GuidedStep;
import com.mindease.repository.GuidedProgramRepository;
import com.mindease.repository.GuidedSessionRepository;
import com.mindease.repository.GuidedStepRepository;
import com.mindease.exception.SessionNotFoundException;
import com.mindease.exception.ProgramNotFoundException;
import com.mindease.exception.AccessDeniedException;
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
        // Verify that the program exists
        Optional<GuidedProgram> program = guidedProgramRepository.findById(programId);
        if (program.isEmpty()) {
            throw new ProgramNotFoundException("Program not found: " + programId);
        }

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
    public GuidedSession updateSessionStep(UUID userId, UUID sessionId, Integer stepNumber, Map<String, Object> responseData) {
        GuidedSession session = guidedSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        // Verify ownership
        if (!session.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have permission to update this session");
        }

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
