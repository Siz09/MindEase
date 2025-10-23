package com.mindease.aop;

import com.mindease.aop.annotations.*;
import com.mindease.security.CurrentUserId;
import com.mindease.service.AuditService;

import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Aspect
@Component
@Order(50)
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

    // ---- Annotation-based pointcuts ----
    // Login logs via the returning advice below (parsing response body) to avoid
    // double-logging.

    // As we cannot read the return value from JoinPoint, add a separate advice with
    // returning param
    @AfterReturning(pointcut = "@annotation(com.mindease.aop.annotations.AuditLogin)", returning = "ret")
    public void afterLoginAnnotatedReturning(Object ret) {
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
                            try {
                                auditService.login(UUID.fromString(s));
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // never impact login flow
        }
    }

    @AfterReturning("@annotation(com.mindease.aop.annotations.AuditChatSent)")
    public void afterChatSentAnnotated() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null)
            auditService.chatSent(uid);
    }

    @AfterReturning("@annotation(com.mindease.aop.annotations.AuditMoodAdded)")
    public void afterMoodAddedAnnotated() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null)
            auditService.moodAdded(uid);
    }

    @AfterReturning("@annotation(com.mindease.aop.annotations.AuditJournalAdded)")
    public void afterJournalAddedAnnotated() {
        UUID uid = tryGetCurrentUserId();
        if (uid != null)
            auditService.journalAdded(uid);
    }
}
