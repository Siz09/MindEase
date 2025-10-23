package com.mindease.aop;

import com.mindease.security.CurrentUserId;
import com.mindease.service.AuditService;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Captures key user actions and writes audit logs asynchronously.
 * Avoids logging request/response bodies to prevent sensitive data leakage.
 */
@Aspect
@Component
public class AuditLogAspect {

    private final AuditService auditService;

    public AuditLogAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    private UUID tryGetCurrentUserId() {
        try {
            return CurrentUserId.get();
        } catch (Exception ignored) {
            return null;
        }
    }

    // ---- LOGIN ----
    // For login, SecurityContext may not yet be populated. We attempt to extract the user id
    // from the returned body which (in this app) includes user.id in the response map.
    @AfterReturning(pointcut = "execution(* com.mindease.controller.AuthController.login(..))", returning = "ret")
    public void afterLogin(Object ret) {
        try {
            if (ret instanceof ResponseEntity<?> resp) {
                Object body = resp.getBody();
                if (body instanceof Map<?, ?> map) {
                    Object userObj = map.get("user");
                    if (userObj instanceof Map<?, ?> userMap) {
                        Object id = userMap.get("id");
                        if (id instanceof UUID uid) {
                            auditService.login(uid);
                        } else if (id instanceof String s) {
                            try { auditService.login(UUID.fromString(s)); } catch (Exception ignored) {}
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // do not interfere with login flow
        }
    }

    // ---- CHAT SENT ----
    @AfterReturning("execution(* com.mindease.controller.ChatApiController.send*(..))")
    public void afterChatSent() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null) auditService.chatSent(uid);
    }

    // ---- MOOD ADDED ----
    @AfterReturning("execution(* com.mindease.controller.MoodController.add*(..))")
    public void afterMoodAdded() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null) auditService.moodAdded(uid);
    }

    // ---- JOURNAL ENTRY ----
    @AfterReturning("execution(* com.mindease.controller.JournalController.add*(..))")
    public void afterJournalAdded() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null) auditService.journalAdded(uid);
    }
}

