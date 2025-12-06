package com.mindease.notification.controller;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.auth.service.UserService;
import com.mindease.notification.model.Notification;
import com.mindease.notification.repository.NotificationRepository;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://mindease.app",
        "https://app.mindease.app" })
@Tag(name = "Notifications", description = "User notification management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Operation(summary = "List notifications (paginated)", description = "Get paginated list of notifications for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @GetMapping("/list")
    public ResponseEntity<?> list(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            Optional<User> userOpt = userService.findByEmail(principalEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> pageData = notificationRepository
                    .findByUserOrderByCreatedAtDesc(userOpt.get(), pageable);
            return ResponseEntity.ok(pageData);

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
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            long unreadCount = notificationRepository.countByUserAndIsReadFalse(user);

            Map<String, Object> response = new HashMap<>();
            response.put("unreadCount", unreadCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to get unread count for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get unread count"));
        }
    }

    @Operation(summary = "Mark a notification as read", description = "Mark a specific notification as read")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Notification marked as read successfully"),
            @ApiResponse(responseCode = "404", description = "Notification not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @PatchMapping("/mark-read/{id}")
    public ResponseEntity<?> markRead(
            Authentication authentication,
            @PathVariable UUID id) {

        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            Optional<User> userOpt = userService.findByEmail(principalEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }

            Optional<Notification> nOpt = notificationRepository.findById(id);
            if (nOpt.isEmpty() || !nOpt.get().getUser().getId().equals(userOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Notification not found"));
            }

            Notification n = nOpt.get();
            n.setIsRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("status", "ok"));

        } catch (Exception e) {
            logger.error("Failed to mark notification as read: {}", id, e);
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
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            // Bulk update to mark all notifications as read (performance optimized)
            int count = notificationRepository.markAllAsReadForUser(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "All notifications marked as read");
            response.put("count", count);

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
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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

    @Operation(summary = "Get notification preferences", description = "Get notification preferences for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(Authentication authentication) {
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");

            Map<String, Object> preferences = new HashMap<>();
            preferences.put("quietHoursStart",
                    user.getQuietHoursStart() != null ? user.getQuietHoursStart().toString() : null);
            preferences.put("quietHoursEnd",
                    user.getQuietHoursEnd() != null ? user.getQuietHoursEnd().toString() : null);
            preferences.put("emailNotifications", true); // Default to true, can be extended
            preferences.put("pushNotifications", true); // Default to true, can be extended

            response.put("preferences", preferences);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to get notification preferences for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to get notification preferences: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update notification preferences", description = "Update notification preferences for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences updated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
    })
    @PutMapping("/preferences")
    @PatchMapping("/preferences")
    public ResponseEntity<?> updatePreferences(
            @RequestBody Map<String, Object> preferences,
            Authentication authentication) {
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            // Update quiet hours if provided
            if (preferences.containsKey("quietHoursStart") && preferences.containsKey("quietHoursEnd")) {
                java.time.LocalTime startTime = null;
                java.time.LocalTime endTime = null;

                Object startObj = preferences.get("quietHoursStart");
                Object endObj = preferences.get("quietHoursEnd");

                if (startObj instanceof String) {
                    startTime = java.time.LocalTime.parse((String) startObj);
                }
                if (endObj instanceof String) {
                    endTime = java.time.LocalTime.parse((String) endObj);
                }

                if (startTime != null && endTime != null) {
                    user.setQuietHoursStart(startTime);
                    user.setQuietHoursEnd(endTime);
                    userRepository.save(user);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Notification preferences updated successfully");

            Map<String, Object> updatedPreferences = new HashMap<>();
            updatedPreferences.put("quietHoursStart",
                    user.getQuietHoursStart() != null ? user.getQuietHoursStart().toString() : null);
            updatedPreferences.put("quietHoursEnd",
                    user.getQuietHoursEnd() != null ? user.getQuietHoursEnd().toString() : null);

            response.put("preferences", updatedPreferences);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to update notification preferences for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update notification preferences: " + e.getMessage()));
        }
    }

    @Operation(summary = "Register FCM token", description = "Register Firebase Cloud Messaging token for push notifications")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token registered successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping("/token")
    public ResponseEntity<?> registerToken(
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String principalEmail = authentication != null ? authentication.getName() : "unknown";
        try {
            User user = userService.findByEmail(principalEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            String token = payload.get("token");
            if (token == null || token.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Token is required"));
            }
            if (token.length() > 500) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Token exceeds maximum length of 500 characters"));
            }

            user.setFcmToken(token);
            userRepository.save(user);
            logger.info("Registered FCM token for user: {}", principalEmail);

            return ResponseEntity.ok(createSuccessResponse("Token registered"));

        } catch (Exception e) {
            logger.error("Failed to register FCM token for user: {}", principalEmail, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to register token"));
        }
    }

    private Map<String, Object> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        return response;
    }
}
