package com.mindease.admin.controller;

import com.mindease.admin.dto.AdminSettingsPayload;
import com.mindease.admin.dto.ContentItemDto;
import com.mindease.admin.dto.UserAdminSummary;
import com.mindease.admin.model.Content;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.admin.model.AdminSettings;
import com.mindease.admin.model.AuditLog;
import com.mindease.admin.repository.AdminSettingsRepository;
import com.mindease.admin.repository.AuditLogRepository;
import com.mindease.crisis.repository.CrisisFlagRepository;
import com.mindease.admin.repository.ContentRepository;
import com.mindease.subscription.model.Subscription;
import com.mindease.subscription.repository.SubscriptionRepository;
import com.mindease.admin.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Management")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AdminManagementController {

    private static final Logger logger = LoggerFactory.getLogger(AdminManagementController.class);
    private static final int DEFAULT_AUDIT_SIZE = 50;
    private static final int MAX_AUDIT_SIZE = 200;

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final CrisisFlagRepository crisisFlagRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AuditService auditService;
    private final ContentRepository contentRepository;
    private final AdminSettingsRepository adminSettingsRepository;

    public AdminManagementController(UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            CrisisFlagRepository crisisFlagRepository,
            SubscriptionRepository subscriptionRepository,
            AuditService auditService,
            ContentRepository contentRepository,
            AdminSettingsRepository adminSettingsRepository) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.crisisFlagRepository = crisisFlagRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.auditService = auditService;
        this.contentRepository = contentRepository;
        this.adminSettingsRepository = adminSettingsRepository;
    }

    // === User management (from AdminUserController) ===

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List users", description = "Paginated list of users with basic admin metadata")
    public Page<UserAdminSummary> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "all") String status) {
        int pageSize = Math.max(1, Math.min(size, 200));
        String effectiveStatus = status == null ? "all" : status.toLowerCase();

        // For "active" and "inactive" statuses, we need to fetch all users first
        // because status is computed from AuditLog (lastActive), which can't be filtered at DB level
        boolean requiresFullFetch = "active".equals(effectiveStatus) || "inactive".equals(effectiveStatus);

        Page<User> usersPage;
        List<User> allUsers;
        long totalElements;

        if (requiresFullFetch) {
            // Fetch all non-banned users (no pagination at DB level)
            if (search != null && !search.isBlank()) {
                // Fetch all matching users (use a large page size as workaround)
                Pageable largePageable = PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"));
                usersPage = userRepository.findByEmailContainingIgnoreCaseAndDeletedAtIsNull(search.trim(), largePageable);
            } else {
                Pageable largePageable = PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"));
                usersPage = userRepository.findByDeletedAtIsNull(largePageable);
            }
            allUsers = usersPage.getContent();
        } else {
            // For "all" and "banned" statuses, we can use DB-level pagination
            Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
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
            allUsers = usersPage.getContent();
        }

        List<UUID> userIds = allUsers.stream().map(User::getId).collect(Collectors.toList());

        Map<UUID, OffsetDateTime> lastActiveMap = fetchLastActiveForUsers(userIds);
        Map<UUID, Long> crisisCountMap = fetchCrisisCounts(userIds);
        Map<UUID, Subscription> subscriptionMap = fetchSubscriptions(userIds);

        List<UserAdminSummary> allSummaries = allUsers.stream()
                .map(user -> toSummary(
                        user,
                        lastActiveMap.get(user.getId()),
                        crisisCountMap.getOrDefault(user.getId(), 0L),
                        subscriptionMap.get(user.getId()),
                        true))
                .filter(summary -> "all".equals(effectiveStatus) ||
                        (summary.status() != null && summary.status().equalsIgnoreCase(effectiveStatus)))
                .collect(Collectors.toList());

        // For "active" and "inactive", manually paginate the filtered list
        if (requiresFullFetch) {
            totalElements = allSummaries.size();
            int start = page * pageSize;
            int end = Math.min(start + pageSize, allSummaries.size());
            List<UserAdminSummary> content = start < allSummaries.size()
                    ? allSummaries.subList(start, end)
                    : Collections.emptyList();
            Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
            return new PageImpl<>(content, pageable, totalElements);
        } else {
            // For "all" and "banned", the DB query already filtered correctly,
            // and status filter above should not remove any items, so use original pagination
            // However, we still need to apply the status filter for consistency
            return new PageImpl<>(allSummaries, usersPage.getPageable(), usersPage.getTotalElements());
        }
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user", description = "Fetch a single user with admin metadata")
    public ResponseEntity<UserAdminSummary> getUser(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(user -> toSummary(
                        user,
                        findLastActive(user.getId()),
                        crisisFlagRepository.countByUserId(user.getId()),
                        subscriptionRepository.findFirstByUser_IdOrderByCreatedAtDesc(user.getId()).orElse(null),
                        false))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user", description = "Currently supports updating logical status (e.g., banned)")
    public ResponseEntity<UserAdminSummary> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body,
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
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Soft-delete a user record (anonymize)")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, Authentication authentication) {
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
    @PostMapping("/users/bulk-action")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Bulk user action", description = "Allows applying simple actions (e.g., ban) to many users")
    public ResponseEntity<Map<String, Object>> bulkUserAction(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        Object actionObj = body.get("action");
        Object idsObj = body.get("userIds");
        if (!(actionObj instanceof String action) || !(idsObj instanceof List<?> rawIds)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "action and userIds are required"));
        }
        int affected = 0;
        List<String> failed = new ArrayList<>();
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

    @GetMapping("/users/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search users", description = "Alias for listUsers() with a search query")
    public Page<UserAdminSummary> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return listUsers(page, size, q, "all");
    }

    @GetMapping("/users/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user statistics", description = "Returns aggregated counts of total, active, banned, and inactive users")
    public ResponseEntity<Map<String, Long>> getUserStats() {
        long total = userRepository.countByDeletedAtIsNull();
        long banned = userRepository.countByDeletedAtIsNullAndBannedTrue();
        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);
        long active = userRepository.countActiveNonBannedUsers(thirtyDaysAgo);
        long inactive = (total - banned) - active;

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("banned", banned);
        stats.put("inactive", inactive);

        return ResponseEntity.ok(stats);
    }

    // === Content & settings (from AdminContentController / AdminSettingsController
    // / AdminGeneralController) ===

    @GetMapping("/content")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List content", description = "Fetch all content records for admin management")
    public List<ContentItemDto> listContent(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        Stream<Content> stream = contentRepository.findAll().stream();

        if (type != null && !type.isBlank()) {
            String normalized = type.trim().toLowerCase(Locale.ROOT);
            if (normalized.endsWith("s")) {
                normalized = normalized.substring(0, normalized.length() - 1);
            }
            String finalType = normalized;
            stream = stream.filter(c -> c.getType() != null && c.getType().equalsIgnoreCase(finalType));
        }

        if (category != null && !category.isBlank()) {
            String normalized = category.trim().toLowerCase(Locale.ROOT);
            stream = stream.filter(
                    c -> c.getCategory() != null && c.getCategory().trim().toLowerCase(Locale.ROOT).equals(normalized));
        }

        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase(Locale.ROOT);
            stream = stream.filter(c -> {
                String title = c.getTitle() == null ? "" : c.getTitle();
                String desc = c.getDescription() == null ? "" : c.getDescription();
                return title.toLowerCase(Locale.ROOT).contains(q) || desc.toLowerCase(Locale.ROOT).contains(q);
            });
        }

        return stream
                .sorted(Comparator.comparing(Content::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(AdminManagementController::toContentDto)
                .toList();
    }

    @PostMapping("/content")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create content", description = "Create a new content item")
    public ContentItemDto createContent(@RequestBody Map<String, Object> body) {
        Content content = new Content();
        applyContentPayload(content, body, true);
        Content saved = contentRepository.save(content);
        return toContentDto(saved);
    }

    @PutMapping("/content/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update content", description = "Update an existing content item")
    public ContentItemDto updateContent(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Content not found"));
        applyContentPayload(content, body, false);
        Content saved = contentRepository.save(content);
        return toContentDto(saved);
    }

    @DeleteMapping("/content/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete content", description = "Delete a content item")
    public ResponseEntity<Map<String, Object>> deleteContent(@PathVariable UUID id) {
        if (!contentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", "Not found"));
        }
        contentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin settings", description = "Fetch global admin settings")
    public AdminSettingsPayload getSettings() {
        AdminSettings settings = adminSettingsRepository.findTopByOrderByIdAsc()
                .orElseGet(AdminSettings::new);
        return new AdminSettingsPayload(
                settings.getCrisisThreshold(),
                settings.getEmailNotifications(),
                settings.isAutoArchive(),
                settings.getAutoArchiveDays(),
                settings.getDailyReportTime() != null ? settings.getDailyReportTime().toString() : null);
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update admin settings", description = "Update global admin settings")
    public AdminSettingsPayload updateSettings(@RequestBody AdminSettingsPayload payload) {
        AdminSettings settings = adminSettingsRepository.findTopByOrderByIdAsc()
                .orElseGet(AdminSettings::new);
        settings.setCrisisThreshold(payload.crisisThreshold());
        settings.setEmailNotifications(payload.emailNotifications());
        settings.setAutoArchive(payload.autoArchive());
        settings.setAutoArchiveDays(payload.autoArchiveDays());
        if (payload.dailyReportTime() != null && !payload.dailyReportTime().isEmpty()) {
            settings.setDailyReportTime(java.time.LocalTime.parse(payload.dailyReportTime()));
        } else {
            settings.setDailyReportTime(null);
        }
        AdminSettings saved = adminSettingsRepository.save(settings);
        return new AdminSettingsPayload(
                saved.getCrisisThreshold(),
                saved.getEmailNotifications(),
                saved.isAutoArchive(),
                saved.getAutoArchiveDays(),
                saved.getDailyReportTime() != null ? saved.getDailyReportTime().toString() : null);
    }

    private static ContentItemDto toContentDto(Content c) {
        return new ContentItemDto(
                c.getId(),
                c.getTitle(),
                c.getDescription(),
                c.getBody(),
                c.getCategory(),
                c.getType(),
                c.getImageUrl(),
                c.getRating(),
                c.getReviewCount(),
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    private static void applyContentPayload(Content content, Map<String, Object> body, boolean requireFields) {
        if (body == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing payload");
        }
        String title = body.get("title") instanceof String s ? s.trim() : null;
        String description = body.get("description") instanceof String s ? s.trim() : null;
        String bodyText = body.get("body") instanceof String s ? s : null;
        String category = body.get("category") instanceof String s ? s.trim() : null;
        String type = body.get("type") instanceof String s ? s.trim() : null;
        String imageUrl = body.get("imageUrl") instanceof String s ? s.trim() : null;

        if (requireFields) {
            if (title == null || title.isBlank()) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Title required");
            }
            if (description == null || description.isBlank()) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Description required");
            }
            if (bodyText == null || bodyText.isBlank()) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Body required");
            }
        }

        if (title != null)
            content.setTitle(title);
        if (description != null)
            content.setDescription(description);
        if (bodyText != null)
            content.setBody(bodyText);
        if (category != null)
            content.setCategory(category);
        if (type != null)
            content.setType(type);
        if (imageUrl != null)
            content.setImageUrl(imageUrl);
    }

    // === Helper methods reused from AdminUserController ===

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
            return Collections.emptyMap();
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
            return Collections.emptyMap();
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
            return Collections.emptyMap();
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
