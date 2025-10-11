package com.mindease.controller;

import com.mindease.model.Notification;
import com.mindease.model.User;
import com.mindease.repository.NotificationRepository;
import com.mindease.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@Tag(name = "Notifications", description = "User notification management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    @Operation(summary = "Get user notifications", description = "Get paginated list of notifications for the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @GetMapping("/list")
    public ResponseEntity<?> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("content", notifications.getContent());
            response.put("totalElements", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
            response.put("currentPage", notifications.getNumber());
            response.put("size", notifications.getSize());
            response.put("first", notifications.isFirst());
            response.put("last", notifications.isLast());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to fetch notifications for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to fetch notifications"));
        }
    }

    @Operation(summary = "Get unread notification count", description = "Get count of unread notifications for the authenticated user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Unread count retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            long unreadCount = notificationRepository.countByUserAndIsSentFalse(user);

            Map<String, Object> response = new HashMap<>();
            response.put("unreadCount", unreadCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to get unread count for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to get unread count"));
        }
    }

    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notification marked as read successfully"),
        @ApiResponse(responseCode = "404", description = "Notification not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @PatchMapping("/{notificationId}/mark-read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID notificationId,
            Authentication authentication) {
        
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
            
            if (notificationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Notification notification = notificationOpt.get();
            
            // Verify the notification belongs to the authenticated user
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.notFound().build();
            }

            notification.setIsSent(true);
            notificationRepository.save(notification);

            return ResponseEntity.ok(createSuccessResponse("Notification marked as read"));

        } catch (Exception e) {
            logger.error("Failed to mark notification as read: {}", notificationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to mark notification as read"));
        }
    }

    @Operation(summary = "Mark all notifications as read", description = "Mark all notifications for the authenticated user as read")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "All notifications marked as read successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @PatchMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Get all unread notifications for the user
            var unreadNotifications = notificationRepository.findByUserAndIsSentFalse(user);
            
            // Mark all as read
            for (Notification notification : unreadNotifications) {
                notification.setIsSent(true);
            }
            
            notificationRepository.saveAll(unreadNotifications);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            response.put("count", unreadNotifications.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to mark all notifications as read for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to mark all notifications as read"));
        }
    }

    @Operation(summary = "Delete notification", description = "Delete a specific notification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notification deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Notification not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable UUID notificationId,
            Authentication authentication) {
        
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
            
            if (notificationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Notification notification = notificationOpt.get();
            
            // Verify the notification belongs to the authenticated user
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.notFound().build();
            }

            notificationRepository.delete(notification);

            return ResponseEntity.ok(createSuccessResponse("Notification deleted"));

        } catch (Exception e) {
            logger.error("Failed to delete notification: {}", notificationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Failed to delete notification"));
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("error", message);
        return response;
    }

    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}
