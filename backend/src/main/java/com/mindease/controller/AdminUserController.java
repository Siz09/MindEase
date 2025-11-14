package com.mindease.controller;

import com.mindease.dto.UserAdminSummary;
import com.mindease.model.AdminSettings;
import com.mindease.model.AuditLog;
import com.mindease.model.User;
import com.mindease.repository.AdminSettingsRepository;
import com.mindease.repository.AuditLogRepository;
import com.mindease.repository.CrisisFlagRepository;
import com.mindease.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin Users")
public class AdminUserController {

    private static final String USER_BANNED_PREFIX = "USER_BANNED:";

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final CrisisFlagRepository crisisFlagRepository;
    private final AdminSettingsRepository adminSettingsRepository;

    public AdminUserController(UserRepository userRepository,
                               AuditLogRepository auditLogRepository,
                               CrisisFlagRepository crisisFlagRepository,
                               AdminSettingsRepository adminSettingsRepository) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.crisisFlagRepository = crisisFlagRepository;
        this.adminSettingsRepository = adminSettingsRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List users", description = "Paginated list of users with basic admin metadata")
    public Page<UserAdminSummary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "all") String status
    ) {
        int pageSize = Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> usersPage;
        if (search != null && !search.isBlank()) {
            usersPage = userRepository.findByEmailContainingIgnoreCase(search.trim(), pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }

        List<UserAdminSummary> content = usersPage.getContent().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        // Note: the status filter is currently applied client-side; this endpoint
        // returns all users that match the search, regardless of status.
        return new PageImpl<>(content, pageable, usersPage.getTotalElements());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user", description = "Fetch a single user with admin metadata")
    public ResponseEntity<UserAdminSummary> get(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(this::toSummary)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user", description = "Currently supports updating logical status (e.g., banned)")
    public ResponseEntity<UserAdminSummary> updateStatus(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, Object> body
    ) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        if (body != null && body.containsKey("status")) {
            Object status = body.get("status");
            if (status instanceof String s) {
                setBannedFlag(user.getId(), "banned".equalsIgnoreCase(s));
            }
        }

        return ResponseEntity.ok(toSummary(user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Hard-delete a user record")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Best-effort delete; in case of FK constraints the operation may fail.
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bulk-action")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk user action", description = "Allows applying simple actions (e.g., ban) to many users")
    public ResponseEntity<java.util.Map<String, Object>> bulkAction(
            @RequestBody java.util.Map<String, Object> body
    ) {
        Object actionObj = body.get("action");
        Object idsObj = body.get("userIds");
        if (!(actionObj instanceof String action) || !(idsObj instanceof List<?> rawIds)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", "action and userIds are required"));
        }
        int affected = 0;
        for (Object o : rawIds) {
            try {
                UUID id = UUID.fromString(String.valueOf(o));
                if ("ban".equalsIgnoreCase(action)) {
                    setBannedFlag(id, true);
                    affected++;
                } else if ("unban".equalsIgnoreCase(action)) {
                    setBannedFlag(id, false);
                    affected++;
                }
            } catch (IllegalArgumentException ignored) {
                // skip invalid UUIDs
            }
        }
        return ResponseEntity.ok(java.util.Map.of("affected", affected));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users", description = "Alias for list() with a search query")
    public Page<UserAdminSummary> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return list(page, size, q, "all");
    }

    private void setBannedFlag(UUID userId, boolean banned) {
        String key = USER_BANNED_PREFIX + userId;
        Optional<AdminSettings> existing = adminSettingsRepository.findByFeatureName(key);
        if (banned) {
            AdminSettings settings = existing.orElseGet(AdminSettings::new);
            settings.setFeatureName(key);
            settings.setEnabled(true);
            adminSettingsRepository.save(settings);
        } else {
            existing.ifPresent(adminSettingsRepository::delete);
        }
    }

    private UserAdminSummary toSummary(User user) {
        OffsetDateTime lastActive = findLastActive(user.getId());
        long crisisCount = crisisFlagRepository.countByUserId(user.getId());
        String status = resolveStatus(user, lastActive);
        return new UserAdminSummary(
                user.getId(),
                user.getEmail(),
                status,
                user.getCreatedAt(),
                lastActive,
                crisisCount
        );
    }

    private OffsetDateTime findLastActive(UUID userId) {
        Page<AuditLog> page = auditLogRepository.findByUserIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(0, 1)
        );
        return page.isEmpty() ? null : page.getContent().get(0).getCreatedAt();
    }

    private String resolveStatus(User user, OffsetDateTime lastActive) {
        String bannedKey = USER_BANNED_PREFIX + user.getId();
        boolean banned = adminSettingsRepository.findByFeatureName(bannedKey)
                .map(AdminSettings::isEnabled)
                .orElse(false);
        if (banned) {
            return "banned";
        }
        if (lastActive == null) {
            return "inactive";
        }
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);
        return lastActive.isBefore(thirtyDaysAgo) ? "inactive" : "active";
    }
}

