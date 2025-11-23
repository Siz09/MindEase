package com.mindease.controller;

import com.mindease.model.Notification;
import com.mindease.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/notifications")
@Tag(name = "Admin Notifications")
public class AdminNotificationController {

    private final NotificationRepository notificationRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public AdminNotificationController(NotificationRepository notificationRepository,
            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send notification", description = "Send a notification to a user or broadcast to all")
    public ResponseEntity<Map<String, Object>> create(
            @org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
        String message = body.get("message");
        String userId = body.get("userId"); // Optional

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        if (userId != null && !userId.isBlank()) {
            // Send to specific user (implementation omitted for brevity, would involve
            // finding user and saving Notification)
            // For now, just send via WebSocket to specific user topic if we had one
            // messagingTemplate.convertAndSendToUser(userId, "/topic/notifications",
            // Map.of("message", message));
            // But since we don't have per-user queues set up in this simple example, we'll
            // just log it.
            return ResponseEntity.badRequest().body(Map.of("error", "Targeting specific user not yet implemented"));
        } else {
            // Broadcast
            UUID notificationId = UUID.randomUUID();
            String messageText = message;
            OffsetDateTime timestamp = OffsetDateTime.now(ZoneOffset.UTC);

            // TODO: Persist system announcement to database
            // SystemAnnouncement announcement = new SystemAnnouncement(notificationId, messageText, timestamp);
            // announcementRepository.save(announcement);

            messagingTemplate.convertAndSend("/topic/notifications", Map.of(
                    "id", notificationId,
                    "title", "System Announcement",
                    "message", messageText,
                    "timestamp", timestamp));
        }

        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List notifications", description = "List recent notifications across all users")
    public List<Map<String, Object>> list() {
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        return notificationRepository.findAll(pageable).getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark notification read", description = "Mark a notification as read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable UUID id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("status", "ok");
                    return ResponseEntity.ok(resp);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Notification not found")));
    }

    private Map<String, Object> toDto(Notification n) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", n.getId());
        map.put("userId", n.getUser() != null ? n.getUser().getId() : null);
        map.put("title", "Notification");
        map.put("message", n.getMessage());
        map.put("isRead", n.getIsRead());
        map.put("timestamp", n.getCreatedAt() != null
                ? n.getCreatedAt().atOffset(ZoneOffset.UTC)
                : OffsetDateTime.now(ZoneOffset.UTC));
        return map;
    }
}
