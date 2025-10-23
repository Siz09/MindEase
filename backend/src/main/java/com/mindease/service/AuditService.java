package com.mindease.service;

import com.mindease.model.AuditLog;
import com.mindease.repository.AuditLogRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditService {
    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    @Async
    public void logAction(UUID userId, String actionType, String details) {
        if (userId == null || actionType == null) return;
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setActionType(actionType);
        if (details != null && details.length() > 4000) {
            log.setDetails(details.substring(0, 4000));
        } else {
            log.setDetails(details);
        }
        repo.save(log);
    }

    @Async
    public void login(UUID userId) {
        logAction(userId, "LOGIN", "User logged in");
    }

    @Async
    public void chatSent(UUID userId) {
        logAction(userId, "CHAT_SENT", "Chat message sent");
    }

    @Async
    public void moodAdded(UUID userId) {
        logAction(userId, "MOOD_ADDED", "Mood entry added");
    }

    @Async
    public void journalAdded(UUID userId) {
        logAction(userId, "JOURNAL_ADDED", "Journal entry added");
    }
}

