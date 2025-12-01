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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class GuidedProgramService {

    private static final Logger logger = LoggerFactory.getLogger(GuidedProgramService.class);
    private static final int MAX_RETRY_ATTEMPTS = 3;

    @Autowired
    private GuidedProgramRepository guidedProgramRepository;

    @Autowired
    private GuidedStepRepository guidedStepRepository;

    @Autowired
    private GuidedSessionRepository guidedSessionRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

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

    public GuidedSession updateSessionStep(UUID userId, UUID sessionId, Integer stepNumber,
            Map<String, Object> responseData) {
        int attempt = 0;
        while (attempt < MAX_RETRY_ATTEMPTS) {
            try {
                return transactionTemplate.execute(status -> {
                    return updateSessionStepInternal(userId, sessionId, stepNumber, responseData);
                });
            } catch (OptimisticLockingFailureException e) {
                attempt++;
                if (attempt >= MAX_RETRY_ATTEMPTS) {
                    logger.warn("Optimistic locking failure after {} attempts for session {}", attempt, sessionId);
                    throw new IllegalArgumentException("Session was modified by another operation. Please try again.");
                }
                logger.debug("Optimistic locking failure, retrying (attempt {}/{}) for session {}", attempt,
                        MAX_RETRY_ATTEMPTS, sessionId);
                // Brief pause before retry to reduce contention (outside transactional scope)
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry", ie);
                }
            }
        }
        throw new IllegalStateException("Unexpected state after retry attempts");
    }

    private GuidedSession updateSessionStepInternal(UUID userId, UUID sessionId, Integer stepNumber,
            Map<String, Object> responseData) {
        GuidedSession session = guidedSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        // Verify ownership
        if (!session.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have permission to update this session");
        }

        // Get total steps for validation
        List<GuidedStep> steps = guidedStepRepository.findByProgramIdOrderByStepNumberAsc(session.getProgramId());
        int totalSteps = steps.size();

        // Validate stepNumber before any mutations
        if (stepNumber == null) {
            throw new IllegalArgumentException("stepNumber cannot be null");
        }
        if (stepNumber <= 0) {
            throw new IllegalArgumentException("stepNumber must be greater than 0");
        }
        if (stepNumber > totalSteps) {
            throw new IllegalArgumentException(
                    String.format("stepNumber %d exceeds total steps %d for this program", stepNumber, totalSteps));
        }

        // Update responses if provided (only after validation)
        if (responseData != null) {
            Map<String, Object> currentResponses = session.getResponses();
            if (currentResponses == null) {
                currentResponses = new HashMap<>();
            }
            // Store response keyed by step number
            currentResponses.put(String.valueOf(stepNumber), responseData);
            session.setResponses(currentResponses);
        }

        // Update step number based on validation
        if (stepNumber >= totalSteps) {
            session.setStatus("completed");
            session.setCompletedAt(LocalDateTime.now());
            session.setCurrentStepNumber(totalSteps); // Stay on last step
        } else {
            session.setCurrentStepNumber(Math.min(stepNumber + 1, totalSteps));
        }

        return guidedSessionRepository.save(session);
    }

    public List<GuidedSession> getUserSessions(UUID userId) {
        return guidedSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
    }
}
