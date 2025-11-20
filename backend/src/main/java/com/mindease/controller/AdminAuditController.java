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
    public org.springframework.http.ResponseEntity<?> list(
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
            Page<AuditLog> result = toPage(slice, pageable);

            // Wrap response in consistent format
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", "success");
            response.put("data", result.getContent());
            response.put("currentPage", result.getNumber());
            response.put("totalItems", result.getTotalElements());
            response.put("totalPages", result.getTotalPages());
            response.put("hasNext", result.hasNext());
            response.put("hasPrevious", result.hasPrevious());

            return org.springframework.http.ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Audit list failed (userId={}, actionType={}, from={}, to={}, page={}, size={})",
                    userId, actionType, from, to, page, pageSize, e);
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to retrieve audit logs: " + e.getMessage());
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public org.springframework.http.ResponseEntity<?> search(@RequestBody AuditLogSearchRequest request) {
        if (request == null) {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", "success");
            response.put("data", java.util.Collections.emptyList());
            response.put("currentPage", 0);
            response.put("totalItems", 0);
            response.put("totalPages", 0);
            return org.springframework.http.ResponseEntity.ok(response);
        }
        UUID userId = null;
        if (request.email() != null && !request.email().isBlank()) {
            User user = userRepository.findByEmail(request.email().trim()).orElse(null);
            if (user == null) {
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("status", "success");
                response.put("data", java.util.Collections.emptyList());
                response.put("currentPage", 0);
                response.put("totalItems", 0);
                response.put("totalPages", 0);
                return org.springframework.http.ResponseEntity.ok(response);
            }
            userId = user.getId();
        }
        int page = request.page() != null ? request.page() : 0;
        int size = request.size() != null ? request.size() : DEFAULT_SIZE;
        int pageSize = Math.min(Math.max(1, size), MAX_SIZE);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        try {
            Slice<AuditLog> slice = repo.findByFilters(userId, request.actionType(), request.from(), request.to(), pageable);
            Page<AuditLog> result = toPage(slice, pageable);

            // Wrap response in consistent format
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("status", "success");
            response.put("data", result.getContent());
            response.put("currentPage", result.getNumber());
            response.put("totalItems", result.getTotalElements());
            response.put("totalPages", result.getTotalPages());
            response.put("hasNext", result.hasNext());
            response.put("hasPrevious", result.hasPrevious());

            return org.springframework.http.ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Audit search failed (email={}, actionType={}, from={}, to={}, page={}, size={})",
                    request.email(), request.actionType(), request.from(), request.to(), page, pageSize, e);
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to search audit logs: " + e.getMessage());
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private static <T> Page<T> toPage(Slice<T> slice, Pageable pageable) {
        long estimatedTotal = slice.hasNext()
                ? (long) ((pageable.getPageNumber() + 2) * pageable.getPageSize())
                : (long) (pageable.getPageNumber() * pageable.getPageSize() + slice.getNumberOfElements());
        return new PageImpl<>(slice.getContent(), pageable, estimatedTotal);
    }
}
