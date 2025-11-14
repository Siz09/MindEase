package com.mindease.controller;

import com.mindease.dto.AuditLogSearchRequest;
import com.mindease.model.AuditLog;
import com.mindease.model.User;
import com.mindease.repository.AuditLogRepository;
import com.mindease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditController {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditController.class);

    private static final int DEFAULT_SIZE = 50;
    private static final int MAX_SIZE = 200;

    private final AuditLogRepository repo;
    private final UserRepository userRepository;

    public AdminAuditController(AuditLogRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
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

        try {
            Slice<AuditLog> slice = repo.findByFilters(userId, actionType, from, to, pageable);
            return toPage(slice, pageable);
        } catch (Exception e) {
            log.error("Audit list failed (userId={}, actionType={}, from={}, to={}, page={}, size={})",
                    userId, actionType, from, to, page, pageSize, e);
            throw e;
        }
    }

    @PostMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AuditLog> search(@RequestBody AuditLogSearchRequest request) {
        if (request == null) {
            return Page.empty();
        }
        UUID userId = null;
        if (request.email() != null && !request.email().isBlank()) {
            User user = userRepository.findByEmail(request.email().trim()).orElse(null);
            if (user == null) {
                return Page.empty();
            }
            userId = user.getId();
        }
        int page = request.page() != null ? request.page() : 0;
        int size = request.size() != null ? request.size() : DEFAULT_SIZE;
        int pageSize = Math.min(Math.max(1, size), MAX_SIZE);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        try {
            Slice<AuditLog> slice = repo.findByFilters(userId, request.actionType(), request.from(), request.to(), pageable);
            return toPage(slice, pageable);
        } catch (Exception e) {
            log.error("Audit search failed (email={}, actionType={}, from={}, to={}, page={}, size={})",
                    request.email(), request.actionType(), request.from(), request.to(), page, pageSize, e);
            throw e;
        }
    }

    private static <T> Page<T> toPage(Slice<T> slice, Pageable pageable) {
        long estimatedTotal = slice.hasNext()
                ? (long) ((pageable.getPageNumber() + 2) * pageable.getPageSize())
                : (long) (pageable.getPageNumber() * pageable.getPageSize() + slice.getNumberOfElements());
        return new PageImpl<>(slice.getContent(), pageable, estimatedTotal);
    }
}
