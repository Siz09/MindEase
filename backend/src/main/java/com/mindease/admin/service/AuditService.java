package com.mindease.admin.service;

import com.mindease.admin.model.AuditLog;
import com.mindease.admin.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private static final String ACTION_LOGIN = "LOGIN";
    private static final String ACTION_CHAT_SENT = "CHAT_SENT";
    private static final String ACTION_MOOD_ADDED = "MOOD_ADDED";
    private static final String ACTION_JOURNAL_ADDED = "JOURNAL_ADDED";
    private static final int DETAILS_MAX = 4000;

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    @Async
    public void logAction(UUID userId, String actionType, String details) {
        if (userId == null || actionType == null) {
            log.error("Failed to log audit action: userId or actionType is null");
            return;
        }
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(userId);
            auditLog.setActionType(actionType);

            if (details != null && details.length() > DETAILS_MAX) {
                auditLog.setDetails(details.substring(0, DETAILS_MAX));
                log.warn("Audit details truncated for userId={}, actionType={}", userId, actionType);
            } else {
                auditLog.setDetails(details);
            }
            repo.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to persist audit log for userId={}, actionType={}", userId, actionType, e);
        }
    }

    public void login(UUID userId) {
        logAction(userId, ACTION_LOGIN, "User logged in");
    }

    public void chatSent(UUID userId) {
        logAction(userId, ACTION_CHAT_SENT, "Chat message sent");
    }

    public void moodAdded(UUID userId) {
        logAction(userId, ACTION_MOOD_ADDED, "Mood entry added");
    }

    public void journalAdded(UUID userId) {
        logAction(userId, ACTION_JOURNAL_ADDED, "Journal entry added");
    }
}

