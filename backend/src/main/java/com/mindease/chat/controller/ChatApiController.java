package com.mindease.chat.controller;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.auth.service.UserService;
import com.mindease.chat.dto.ChatResponse;
import com.mindease.chat.dto.TypingEvent;
import com.mindease.chat.model.ChatSession;
import com.mindease.chat.model.Message;
import com.mindease.chat.repository.ChatSessionRepository;
import com.mindease.chat.repository.MessageRepository;
import com.mindease.chat.service.AIProviderManager;
import com.mindease.chat.service.ChatService;
import com.mindease.crisis.service.CrisisFlaggingService;
import com.mindease.subscription.service.PremiumAccessService;
import com.mindease.shared.config.ChatConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.mindease.shared.security.RequiresPremium;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.mindease.shared.aop.annotations.AuditChatSent;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Collections;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@Tag(name = "Chat", description = "Real-time chat with AI assistant")
@SecurityRequirement(name = "Bearer Authentication")
public class ChatApiController {

    private static final int MAX_CONVERSATION_HISTORY = 12;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AIProviderManager aiProviderManager;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private CrisisFlaggingService crisisFlaggingService;

    @Autowired
    private PremiumAccessService premiumAccessService;

    @Autowired
    private ChatConfig chatConfig;

    @Autowired
    private ChatService chatService;

    private static final Logger logger = LoggerFactory.getLogger(ChatApiController.class);

    @Operation(summary = "Send a chat message", description = "Send a message to the AI assistant and receive a response. Optionally specify sessionId to send to a specific chat session.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Message sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or user not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Session not found")
    })
    @PostMapping("/send")
    @AuditChatSent
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request, Authentication authentication) {
        try {
            logger.info("=== INCOMING MESSAGE REQUEST ===");
            logger.info("Message: {}", request.getMessage());
            logger.info("SessionId: {}", request.getSessionId());
            logger.info("Authentication: {}", authentication.getName());

            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                logger.error("User not found for email: {}", email);
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            logger.info("Processing message for user ID: {}", user.getId());

            // Track user activity (async - fire-and-forget)
            userService.trackUserActivityAsync(user);

            // Get chat session - use provided sessionId or get/create most recent
            ChatSession chatSession;
            boolean isNewSession = false;

            if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
                // Use specified session
                try {
                    UUID sessionId = UUID.fromString(request.getSessionId());
                    Optional<ChatSession> sessionOptional = chatService.getChatSessionById(sessionId, user);
                    if (sessionOptional.isEmpty()) {
                        return ResponseEntity.status(404).body(createErrorResponse("Session not found"));
                    }
                    chatSession = sessionOptional.get();
                    logger.info("Using specified chat session: {}", sessionId);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(createErrorResponse("Invalid session ID format"));
                }
            } else {
                // Get or create chat session (backward compatibility)
                chatSession = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
                        .stream()
                        .findFirst()
                        .orElseGet(() -> {
                            logger.info("Creating new chat session for user: {}", user.getId());
                            return chatSessionRepository.save(new ChatSession(user));
                        });
                // Check if this is a brand new session (no messages yet)
                isNewSession = chatService.getMessageCount(chatSession) == 0;
            }

            chatSession.setUpdatedAt(java.time.LocalDateTime.now());
            chatSessionRepository.save(chatSession);

            // Check for crisis
            boolean isCrisis = aiProviderManager.isCrisisMessage(request.getMessage());
            logger.info("Crisis detection result: {}", isCrisis);

            // Enforce soft daily message limit for free users (non-crisis only)
            // Crisis messages ALWAYS bypass rate limits for user safety
            boolean isPremium = premiumAccessService.isPremium(user.getId());
            if (!isPremium && !isCrisis) {
                Integer limit = chatConfig.getLimits().getFreeDailyMessageLimit();
                if (limit != null && limit > 0) {
                    LocalDate today = LocalDate.now();
                    LocalDateTime start = today.atStartOfDay();
                    LocalDateTime end = today.plusDays(1).atStartOfDay();
                    long sentToday = messageRepository
                            .countByChatSession_UserAndIsUserMessageTrueAndCreatedAtBetween(user, start, end);
                    logger.info("Free daily usage: userId={}, sentToday={}, limit={}", user.getId(), sentToday, limit);
                    if (sentToday >= limit) {
                        logger.info("Free daily limit reached for user: {}", user.getId());
                        return ResponseEntity.status(429).body(createErrorResponse(
                                "You've reached today's free chat limit. You can continue tomorrow or upgrade to Premium for unlimited chat."));
                    }
                }
            } else if (isCrisis) {
                logger.info("Crisis message detected - bypassing rate limits for user safety: userId={}", user.getId());
            }

            // Save user message
            Message userMessage = new Message(chatSession, request.getMessage(), true);
            userMessage.setIsCrisisFlagged(isCrisis);
            userMessage = messageRepository.save(userMessage);
            logger.info("Saved user message with ID: {}", userMessage.getId());

            // Auto-generate title from first message if session is new
            chatService.autoGenerateTitle(chatSession);

            // Fire-and-forget crisis evaluation + alerts (async, idempotent)
            try {
                crisisFlaggingService.evaluateAndFlag(chatSession.getId(), user.getId(), request.getMessage());
            } catch (Exception ex) {
                logger.warn("Crisis flagging dispatch failed: {}", ex.getMessage());
            }

            // Create user message payload for WebSocket
            Map<String, Object> userMessagePayload = createMessagePayload(userMessage, true);

            // Send user message via WebSocket
            String userTopic = "/topic/user/" + user.getId();
            logger.info("Sending user message to topic: {}", userTopic);
            logger.info("User message payload: {}", userMessagePayload);

            messagingTemplate.convertAndSend(userTopic, userMessagePayload);

            // Send typing indicator - bot is "typing"
            TypingEvent typingStart = new TypingEvent(user.getId(), true);
            messagingTemplate.convertAndSend(userTopic + "/typing", typingStart);
            logger.debug("Sent typing start event to: {}", userTopic + "/typing");

            // Handle crisis response first if needed
            Message crisisMessage = null;
            Message botMessage = null;
            Map<String, Object> botMessagePayload = null;
            String aiProvider = null;
            
            if (isCrisis) {
                String crisisResponse = "I'm concerned about what you're sharing. Please consider contacting a mental health professional or a crisis helpline immediately. Your wellbeing matters, and there are people who want to help you.";
                crisisMessage = new Message(chatSession, crisisResponse, false);
                crisisMessage.setIsCrisisFlagged(true);
                crisisMessage = messageRepository.save(crisisMessage);

                Map<String, Object> crisisMessagePayload = createMessagePayload(crisisMessage, false);

                logger.info("Sending crisis message to topic: {}", userTopic);
                logger.info("Crisis message payload: {}", crisisMessagePayload);

                messagingTemplate.convertAndSend(userTopic, crisisMessagePayload);
                
                // Send typing indicator - bot stopped "typing"
                TypingEvent typingStop = new TypingEvent(user.getId(), false);
                messagingTemplate.convertAndSend(userTopic + "/typing", typingStop);
                logger.debug("Sent typing stop event to: {}", userTopic + "/typing");
            } else {
                // Only generate AI response if NOT a crisis (crisis already handled above)
                // Prepare recent conversation history using DB pagination
                Pageable historyPage = PageRequest.of(0, MAX_CONVERSATION_HISTORY, Sort.by("createdAt").descending());
                List<Message> recentHistory = new java.util.ArrayList<>(
                        messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, historyPage).getContent());
                Collections.reverse(recentHistory); // chronological order oldest -> newest for AI context

                // Avoid duplicating the current user message in AI context
                if (!recentHistory.isEmpty()) {
                    Message last = recentHistory.get(recentHistory.size() - 1);
                    String incoming = request.getMessage();
                    if (Boolean.TRUE.equals(last.getIsUserMessage())
                            && last.getContent() != null
                            && incoming != null
                            && last.getContent().equals(incoming)) {
                        // Remove the most-recent (current) user message; service will append it
                        // explicitly
                        recentHistory.remove(recentHistory.size() - 1);
                    }
                }

                // Generate AI response with context using AIProviderManager
                logger.info("Generating AI response with {} history messages...", recentHistory.size());
                ChatResponse aiResponse = aiProviderManager.generateResponse(
                        request.getMessage(),
                        user.getId().toString(),
                        recentHistory,
                        null);
                logger.info("Generated AI response using provider: {}", aiResponse.getProvider());
                logger.info("Generated AI response: {}", aiResponse.getContent());

                botMessage = new Message(chatSession, aiResponse.getContent(), false);
                botMessage = messageRepository.save(botMessage);
                logger.info("Saved bot message with ID: {}", botMessage.getId());

                // Create bot message payload for WebSocket
                botMessagePayload = createMessagePayload(botMessage, false);
                // Add provider info to help identify which AI is being used
                aiProvider = aiResponse.getProvider();
                botMessagePayload.put("provider", aiProvider);

                logger.info("Sending bot message to topic: {}", userTopic);
                logger.info("Bot message payload: {}", botMessagePayload);

                // Send typing indicator - bot stopped "typing"
                TypingEvent typingStop = new TypingEvent(user.getId(), false);
                messagingTemplate.convertAndSend(userTopic + "/typing", typingStop);
                logger.debug("Sent typing stop event to: {}", userTopic + "/typing");

                messagingTemplate.convertAndSend(userTopic, botMessagePayload);
            }

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Messages sent and processed successfully");

            Map<String, Object> data = new HashMap<>();
            data.put("userMessage", userMessagePayload);
            if (botMessagePayload != null) {
                data.put("botMessage", botMessagePayload);
            }
            if (crisisMessage != null) {
                data.put("crisisMessage", createMessagePayload(crisisMessage, false));
            }

            response.put("data", data);

            logger.info("=== MESSAGE PROCESSING COMPLETED SUCCESSFULLY ===");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("=== ERROR PROCESSING MESSAGE ===", e);
            return ResponseEntity.badRequest().body(createErrorResponse("Failed to send message: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get chat history", description = "Get message history. Optionally specify sessionId to get history for a specific session.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "History retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "User not found or invalid parameters"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "asc") String sort,
            @RequestParam(required = false) String sessionId) {
        try {
            if (!"asc".equalsIgnoreCase(sort) && !"desc".equalsIgnoreCase(sort)) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid sort parameter. Must be 'asc' or 'desc'."));
            }
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                logger.error("User not found for email: {}", email);
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            logger.info("Fetching chat history for user: {}, sessionId: {}", user.getId(), sessionId);

            Optional<ChatSession> chatSessionOptional;

            if (sessionId != null && !sessionId.isEmpty()) {
                // Use specified session
                try {
                    UUID sessionUUID = UUID.fromString(sessionId);
                    chatSessionOptional = chatService.getChatSessionById(sessionUUID, user);
                    if (chatSessionOptional.isEmpty()) {
                        return ResponseEntity.status(404).body(createErrorResponse("Session not found"));
                    }
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(createErrorResponse("Invalid session ID format"));
                }
            } else {
                // Backward compatibility - get most recent session
                chatSessionOptional = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
                        .stream()
                        .findFirst();
            }

            if (chatSessionOptional.isEmpty()) {
                return ResponseEntity.ok(createEmptyHistoryResponse());
            }

            ChatSession chatSession = chatSessionOptional.get();

            Sort sortSpec = "desc".equalsIgnoreCase(sort)
                    ? Sort.by("createdAt").descending()
                    : Sort.by("createdAt").ascending();
            Pageable pageable = PageRequest.of(page, size, sortSpec);
            Page<Message> messagesPage = "desc".equalsIgnoreCase(sort)
                    ? messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable)
                    : messageRepository.findByChatSessionOrderByCreatedAtAsc(chatSession, pageable);

            // Normalize to the same payload shape used by WebSocket messages
            List<Map<String, Object>> items = new java.util.ArrayList<>();
            for (Message m : messagesPage.getContent()) {
                boolean isUser = Boolean.TRUE.equals(m.getIsUserMessage());
                items.add(createMessagePayload(m, isUser));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", items);
            response.put("sessionId", chatSession.getId().toString());
            Map<String, Object> pagination = new HashMap<>();
            pagination.put("currentPage", messagesPage.getNumber());
            pagination.put("totalPages", messagesPage.getTotalPages());
            pagination.put("pageSize", messagesPage.getSize());
            pagination.put("totalItems", messagesPage.getTotalElements());
            response.put("pagination", pagination);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to fetch chat history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to fetch chat history: " + e.getMessage()));
        }
    }

    // Helper method to create consistent message payloads
    private Map<String, Object> createMessagePayload(Message message, boolean isUserMessage) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", message.getId().toString());
        payload.put("content", message.getContent() != null ? message.getContent() : "");
        payload.put("isUserMessage", isUserMessage);
        payload.put("isCrisisFlagged", message.getIsCrisisFlagged() != null ? message.getIsCrisisFlagged() : false);
        payload.put("createdAt", message.getCreatedAt().toString());
        payload.put("sender", isUserMessage ? "user" : "bot");
        payload.put("type", "message");
        // Include sessionId for frontend filtering
        if (message.getChatSession() != null) {
            payload.put("sessionId", message.getChatSession().getId().toString());
        }

        return payload;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("status", "error");
        return response;
    }

    private Map<String, Object> createEmptyHistoryResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", new java.util.ArrayList<>());
        response.put("currentPage", 0);
        response.put("totalItems", 0);
        response.put("totalPages", 0);
        return response;
    }

    // ==================== Chat Session Management Endpoints ====================

    @Operation(summary = "Create a new chat session", description = "Create a new chat session for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Session created successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            ChatSession session = chatService.createChatSession(user);
            logger.info("Created new chat session {} for user {}", session.getId(), user.getId());

            return ResponseEntity.ok(createSessionPayload(session, null));
        } catch (Exception e) {
            logger.error("Failed to create chat session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Failed to create session: " + e.getMessage()));
        }
    }

    @Operation(summary = "List all chat sessions", description = "Get all chat sessions for the authenticated user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sessions retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/sessions")
    public ResponseEntity<?> listSessions(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            List<ChatSession> sessions = chatService.getChatSessionsForUser(user);

            List<Map<String, Object>> sessionList = new java.util.ArrayList<>();
            for (ChatSession session : sessions) {
                String preview = chatService.getSessionPreview(session).orElse(null);
                sessionList.add(createSessionPayload(session, preview));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", sessionList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to list chat sessions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Failed to list sessions: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get chat session history", description = "Get message history for a specific chat session")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "History retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<?> getSessionHistory(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "asc") String sort) {
        try {
            if (!"asc".equalsIgnoreCase(sort) && !"desc".equalsIgnoreCase(sort)) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Invalid sort parameter. Must be 'asc' or 'desc'."));
            }

            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            Optional<ChatSession> sessionOptional = chatService.getChatSessionById(sessionId, user);

            if (sessionOptional.isEmpty()) {
                return ResponseEntity.status(404).body(createErrorResponse("Session not found"));
            }

            ChatSession chatSession = sessionOptional.get();

            Sort sortSpec = "desc".equalsIgnoreCase(sort)
                    ? Sort.by("createdAt").descending()
                    : Sort.by("createdAt").ascending();
            Pageable pageable = PageRequest.of(page, size, sortSpec);
            Page<Message> messagesPage = "desc".equalsIgnoreCase(sort)
                    ? messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable)
                    : messageRepository.findByChatSessionOrderByCreatedAtAsc(chatSession, pageable);

            List<Map<String, Object>> items = new java.util.ArrayList<>();
            for (Message m : messagesPage.getContent()) {
                boolean isUser = Boolean.TRUE.equals(m.getIsUserMessage());
                items.add(createMessagePayload(m, isUser));
            }

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", items);
            Map<String, Object> pagination = new HashMap<>();
            pagination.put("currentPage", messagesPage.getNumber());
            pagination.put("totalPages", messagesPage.getTotalPages());
            pagination.put("pageSize", messagesPage.getSize());
            pagination.put("totalItems", messagesPage.getTotalElements());
            response.put("pagination", pagination);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get session history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to get session history: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update chat session", description = "Update the title of a chat session")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Session updated successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PutMapping("/sessions/{sessionId}")
    public ResponseEntity<?> updateSession(
            Authentication authentication,
            @PathVariable UUID sessionId,
            @RequestBody UpdateSessionRequest request) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            Optional<ChatSession> updatedSession = chatService.updateSessionTitle(sessionId, request.getTitle(), user);

            if (updatedSession.isEmpty()) {
                return ResponseEntity.status(404).body(createErrorResponse("Session not found"));
            }

            logger.info("Updated chat session {} title to '{}'", sessionId, request.getTitle());
            String preview = chatService.getSessionPreview(updatedSession.get()).orElse(null);
            return ResponseEntity.ok(createSessionPayload(updatedSession.get(), preview));
        } catch (Exception e) {
            logger.error("Failed to update session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Failed to update session: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete chat session", description = "Delete a chat session and all its messages")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Session deleted successfully"),
            @ApiResponse(responseCode = "400", description = "User not found"),
            @ApiResponse(responseCode = "404", description = "Session not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(
            Authentication authentication,
            @PathVariable UUID sessionId) {
        try {
            String email = authentication.getName();
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
            }

            User user = userOptional.get();
            boolean deleted = chatService.deleteChatSession(sessionId, user);

            if (!deleted) {
                return ResponseEntity.status(404).body(createErrorResponse("Session not found"));
            }

            logger.info("Deleted chat session {} for user {}", sessionId, user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Session deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to delete session: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(createErrorResponse("Failed to delete session: " + e.getMessage()));
        }
    }

    // Helper method to create session payload
    private Map<String, Object> createSessionPayload(ChatSession session, String preview) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", session.getId().toString());
        payload.put("title", session.getTitle() != null ? session.getTitle() : "New Chat");
        payload.put("createdAt", session.getCreatedAt().toString());
        payload.put("updatedAt", session.getUpdatedAt().toString());
        if (preview != null) {
            payload.put("preview", preview);
        }
        payload.put("status", "success");
        return payload;
    }

    public static class SendMessageRequest {
        private String message;
        private String sessionId;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getSessionId() {
            return sessionId;
        }

        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
    }

    public static class UpdateSessionRequest {
        private String title;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }
    }
}
