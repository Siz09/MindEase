package com.mindease.controller;

import com.mindease.model.AuditLog;
import com.mindease.repository.AuditLogRepository;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditController {

    private static final int DEFAULT_SIZE = 50;
    private static final int MAX_SIZE = 200;

    private final AuditLogRepository repo;

    public AdminAuditController(AuditLogRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditLog> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size
    ) {
        int pageSize = Math.min(size == null ? DEFAULT_SIZE : Math.max(1, size), MAX_SIZE);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (userId != null && actionType != null && from != null && to != null) {
            Slice<AuditLog> slice = repo.findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                    userId, actionType, from, to, pageable);
            return toPage(slice, pageable);
        }
        if (userId != null && actionType == null && from == null && to == null) {
            return repo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        if (userId == null && actionType != null && from == null && to == null) {
            return repo.findByActionTypeOrderByCreatedAtDesc(actionType, pageable);
        }
        if (from != null && to != null && userId == null && actionType == null) {
            return repo.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to, pageable);
        }
        return repo.findAllByOrderByCreatedAtDesc(pageable);
    }

    private static <T> Page<T> toPage(Slice<T> slice, Pageable pageable) {
        return new PageImpl<>(slice.getContent(), pageable,
                slice.hasNext() ? (long) ((pageable.getPageNumber() + 2) * pageable.getPageSize()) : slice.getNumberOfElements());
    }
}

