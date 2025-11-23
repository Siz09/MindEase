package com.mindease.controller;

import com.mindease.dto.UserAdminSummary;
import com.mindease.model.AuditLog;
import com.mindease.model.User;
import com.mindease.model.Subscription;
import com.mindease.repository.AuditLogRepository;
import com.mindease.repository.CrisisFlagRepository;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.AuditService;
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
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin Users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final CrisisFlagRepository crisisFlagRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AuditService auditService;

    public AdminUserController(UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            CrisisFlagRepository crisisFlagRepository,
            SubscriptionRepository subscriptionRepository,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.crisisFlagRepository = crisisFlagRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List users", description = "Paginated list of users with basic admin metadata")
    public Page<UserAdminSummary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "all") String status) {
        int pageSize = Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String effectiveStatus = status == null ? "all" : status.toLowerCase();

        Page<User> usersPage;
        if (search != null && !search.isBlank()) {
            if ("banned".equals(effectiveStatus)) {
                usersPage = userRepository.findByEmailContainingIgnoreCaseAndDeletedAtIsNullAndBannedTrue(
                        search.trim(), pageable);
            } else {
                usersPage = userRepository.findByEmailContainingIgnoreCaseAndDeletedAtIsNull(search.trim(), pageable);
            }
        } else {
            if ("banned".equals(effectiveStatus)) {
                usersPage = userRepository.findByDeletedAtIsNullAndBannedTrue(pageable);
            } else {
                usersPage = userRepository.findByDeletedAtIsNull(pageable);
            }
        }

        List<User> users = usersPage.getContent();
        List<UUID> userIds = users.stream().map(User::getId).collect(Collectors.toList());

        Map<UUID, OffsetDateTime> lastActiveMap = fetchLastActiveForUsers(userIds);
        Map<UUID, Long> crisisCountMap = fetchCrisisCounts(userIds);
        Map<UUID, Subscription> subscriptionMap = fetchSubscriptions(userIds);

        List<UserAdminSummary> content = users.stream()
                .map(user -> toSummary(
                        user,
                        lastActiveMap.get(user.getId()),
                        crisisCountMap.getOrDefault(user.getId(), 0L),
                        subscriptionMap.get(user.getId()),
                        true // mask email in list view
                ))
                .filter(summary -> {
                    if ("all".equals(effectiveStatus)) {
                        return true;
                    }
                    return summary.status() != null
                            && summary.status().equalsIgnoreCase(effectiveStatus);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(content, pageable, usersPage.getTotalElements());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user", description = "Fetch a single user with admin metadata")
    public ResponseEntity<UserAdminSummary> get(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(user -> toSummary(
                        user,
                        findLastActive(user.getId()),
                        crisisFlagRepository.countByUserId(user.getId()),
                        subscriptionRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId()).orElse(null),
                        false // do not mask email for single-user view
                ))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user", description = "Currently supports updating logical status (e.g., banned)")
    public ResponseEntity<UserAdminSummary> updateStatus(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication authentication) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();

        if (body != null && body.containsKey("status")) {
            Object status = body.get("status");
            if (status instanceof String s) {
                boolean banned = "banned".equalsIgnoreCase(s);
                setBannedFlag(user.getId(), banned, authentication);
                user = userRepository.findById(id).orElseThrow();
                // Audit log
                logAdminAction(authentication, banned ? "ADMIN_BAN_USER" : "ADMIN_UNBAN_USER",
                        (banned ? "Banned user: " : "Unbanned user: ") + user.getEmail());
            }
        }

        return ResponseEntity.ok(toSummary(
                user,
                findLastActive(user.getId()),
                crisisFlagRepository.countByUserId(user.getId()),
                subscriptionRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId()).orElse(null),
                false));
    }

    @Transactional
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Soft-delete a user record (anonymize)")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        String anonymizedEmail = "deleted-" + user.getId() + "@anonymized.local";
        user.setEmail(anonymizedEmail);
        user.setDeletedAt(OffsetDateTime.now(ZoneOffset.UTC));
        userRepository.save(user);

        logAdminAction(authentication, "ADMIN_DELETE_USER", "User anonymized: " + id);

        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PostMapping("/bulk-action")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk user action", description = "Allows applying simple actions (e.g., ban) to many users")
    public ResponseEntity<java.util.Map<String, Object>> bulkAction(
            @RequestBody java.util.Map<String, Object> body,
            Authentication authentication) {
        Object actionObj = body.get("action");
        Object idsObj = body.get("userIds");
        if (!(actionObj instanceof String action) || !(idsObj instanceof List<?> rawIds)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", "action and userIds are required"));
        }
        int affected = 0;
        java.util.List<String> failed = new java.util.ArrayList<>();
        for (Object o : rawIds) {
            try {
                UUID id = UUID.fromString(String.valueOf(o));
                if (!userRepository.existsById(id)) {
                    failed.add(id.toString());
                    continue;
                }
                if ("ban".equalsIgnoreCase(action)) {
                    setBannedFlag(id, true, authentication);
                    logAdminAction(authentication, "ADMIN_BULK_BAN_USER", "Bulk banned user: " + id);
                    affected++;
                } else if ("unban".equalsIgnoreCase(action)) {
                    setBannedFlag(id, false, authentication);
                    logAdminAction(authentication, "ADMIN_BULK_UNBAN_USER", "Bulk unbanned user: " + id);
                    affected++;
                } else {
                    failed.add(id.toString());
                }
            } catch (IllegalArgumentException ex) {
                failed.add(String.valueOf(o));
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("affected", affected);
        result.put("failed", failed);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users", description = "Alias for list() with a search query")
    public Page<UserAdminSummary> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return list(page, size, q, "all");
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user statistics", description = "Returns aggregated counts of total, active, banned, and inactive users")
    public ResponseEntity<Map<String, Long>> getStats() {
        long total = userRepository.countByDeletedAtIsNull();
        long banned = userRepository.countByDeletedAtIsNullAndBannedTrue();

        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);

        // Count active users via a custom repository query that joins with audit logs
        long active = userRepository.countActiveNonBannedUsers(thirtyDaysAgo);
        long inactive = (total - banned) - active;

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("banned", banned);
        stats.put("inactive", inactive);

        return ResponseEntity.ok(stats);
    }

    private void setBannedFlag(UUID userId, boolean banned, Authentication authentication) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (banned) {
            user.setBannedAt(OffsetDateTime.now(ZoneOffset.UTC));
            user.setBannedBy(resolveAdminId(authentication));
            user.setBanned(true);
        } else {
            user.setBannedAt(null);
            user.setBannedBy(null);
            user.setBanned(false);
        }
        userRepository.save(user);
    }

    private UserAdminSummary toSummary(User user,
            OffsetDateTime lastActive,
            long crisisCount,
            Subscription subscription,
            boolean maskEmail) {
        String status = resolveStatus(user, lastActive);
        String email = user.getEmail();
        if (maskEmail && email != null) {
            email = maskEmail(email);
        }

        String subPlan = "Free";
        String subStatus = "none";
        OffsetDateTime subRenews = null;

        if (subscription != null) {
            subPlan = subscription.getPlanType() != null ? subscription.getPlanType().name() : "Free";
            subStatus = subscription.getStatus() != null ? subscription.getStatus().name() : "none";
            // TODO: Add currentPeriodEnd to Subscription entity
            subRenews = null; // Don't show incorrect renewal dates
        }

        return new UserAdminSummary(
                user.getId(),
                email,
                status,
                user.getCreatedAt() != null
                        ? user.getCreatedAt().atOffset(ZoneOffset.UTC)
                        : null,
                lastActive,
                crisisCount,
                subPlan,
                subStatus,
                subRenews);
    }

    private OffsetDateTime findLastActive(UUID userId) {
        Page<AuditLog> page = auditLogRepository.findByUserIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(0, 1));
        return page.isEmpty() ? null : page.getContent().get(0).getCreatedAt();
    }

    private String resolveStatus(User user, OffsetDateTime lastActive) {
        if (user.isBanned()) {
            return "banned";
        }
        if (lastActive == null) {
            return "inactive";
        }
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);
        return lastActive.isBefore(thirtyDaysAgo) ? "inactive" : "active";
    }

    private Map<UUID, OffsetDateTime> fetchLastActiveForUsers(List<UUID> userIds) {
        if (userIds.isEmpty())
            return java.util.Collections.emptyMap();
        Map<UUID, OffsetDateTime> map = new HashMap<>();
        for (Object[] row : auditLogRepository.findLastActiveByUserIds(userIds)) {
            UUID userId = (UUID) row[0];
            OffsetDateTime last = (OffsetDateTime) row[1];
            map.put(userId, last);
        }
        return map;
    }

    private Map<UUID, Long> fetchCrisisCounts(List<UUID> userIds) {
        if (userIds.isEmpty())
            return java.util.Collections.emptyMap();
        List<Object[]> rows = crisisFlagRepository.countByUserIdIn(userIds);
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            UUID userId = (UUID) row[0];
            Long count = row[1] == null ? 0L : ((Number) row[1]).longValue();
            map.put(userId, count);
        }
        return map;
    }

    private Map<UUID, Subscription> fetchSubscriptions(List<UUID> userIds) {
        if (userIds.isEmpty())
            return java.util.Collections.emptyMap();
        // Fetch all subscriptions for these users and group by userId, keeping only the latest
        List<Subscription> subs = subscriptionRepository.findByUser_IdIn(userIds);
        Map<UUID, Subscription> map = new HashMap<>();
        for (Subscription sub : subs) {
            UUID userId = sub.getUser().getId();
            Subscription existing = map.get(userId);
            if (existing == null || sub.getCreatedAt().isAfter(existing.getCreatedAt())) {
                map.put(userId, sub);
            }
        }
        return map;
    }

    private static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        String domain = email.substring(at);
        char first = email.charAt(0);
        return first + "***" + domain;
    }

    private UUID resolveAdminId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }

    private void logAdminAction(Authentication authentication, String actionType, String details) {
        UUID adminId = resolveAdminId(authentication);
        if (adminId == null) {
            return;
        }
        auditService.logAction(adminId, actionType, details);
    }
}
