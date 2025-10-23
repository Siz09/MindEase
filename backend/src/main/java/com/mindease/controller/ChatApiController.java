package com.mindease.controller;

import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.repository.ChatSessionRepository;
import com.mindease.repository.MessageRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.ChatBotService;
import com.mindease.service.UserService;
import com.mindease.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.mindease.security.RequiresPremium;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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

  @Autowired
  private ChatSessionRepository chatSessionRepository;

  @Autowired
  private MessageRepository messageRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private ChatBotService chatBotService;

  @Autowired
  private UserService userService;

  @Autowired
  private SimpMessagingTemplate messagingTemplate;

  private static final Logger logger = LoggerFactory.getLogger(ChatApiController.class);

  @Operation(summary = "Send a chat message", description = "Send a message to the AI assistant and receive a response")
  @ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Message sent successfully"),
    @ApiResponse(responseCode = "400", description = "Invalid request or user not found"),
    @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token")
  })
  @RequiresPremium
  @PostMapping("/send")
  @AuditChatSent
  public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request, Authentication authentication) {
    try {
      logger.info("=== INCOMING MESSAGE REQUEST ===");
      logger.info("Message: {}", request.getMessage());
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

      // Get or create chat session
      ChatSession chatSession = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
        .stream()
        .findFirst()
        .orElseGet(() -> {
          logger.info("Creating new chat session for user: {}", user.getId());
          return chatSessionRepository.save(new ChatSession(user));
        });

      chatSession.setUpdatedAt(java.time.LocalDateTime.now());
      chatSessionRepository.save(chatSession);

      // Check for crisis
      boolean isCrisis = chatBotService.isCrisisMessage(request.getMessage());
      logger.info("Crisis detection result: {}", isCrisis);

      // Save user message
      Message userMessage = new Message(chatSession, request.getMessage(), true);
      userMessage.setIsCrisisFlagged(isCrisis);
      userMessage = messageRepository.save(userMessage);
      logger.info("Saved user message with ID: {}", userMessage.getId());

      // Create user message payload for WebSocket
      Map<String, Object> userMessagePayload = createMessagePayload(userMessage, true);

      // Send user message via WebSocket
      String userTopic = "/topic/user/" + user.getId();
      logger.info("Sending user message to topic: {}", userTopic);
      logger.info("User message payload: {}", userMessagePayload);

      messagingTemplate.convertAndSend(userTopic, userMessagePayload);

      // Handle crisis response first if needed
      Message crisisMessage = null;
      if (isCrisis) {
        String crisisResponse = "I'm concerned about what you're sharing. Please consider contacting a mental health professional or a crisis helpline immediately. Your wellbeing matters, and there are people who want to help you.";
        crisisMessage = new Message(chatSession, crisisResponse, false);
        crisisMessage.setIsCrisisFlagged(true);
        crisisMessage = messageRepository.save(crisisMessage);

        Map<String, Object> crisisMessagePayload = createMessagePayload(crisisMessage, false);

        logger.info("Sending crisis message to topic: {}", userTopic);
        logger.info("Crisis message payload: {}", crisisMessagePayload);

        messagingTemplate.convertAndSend(userTopic, crisisMessagePayload);
      }

      // Generate AI response
      logger.info("Generating AI response...");
      ChatResponse aiResponse = chatBotService.generateResponse(request.getMessage(), user.getId().toString());
      logger.info("Generated AI response: {}", aiResponse.getContent());

      Message botMessage = new Message(chatSession, aiResponse.getContent(), false);
      botMessage = messageRepository.save(botMessage);
      logger.info("Saved bot message with ID: {}", botMessage.getId());

      // Create bot message payload for WebSocket
      Map<String, Object> botMessagePayload = createMessagePayload(botMessage, false);

      logger.info("Sending bot message to topic: {}", userTopic);
      logger.info("Bot message payload: {}", botMessagePayload);

      messagingTemplate.convertAndSend(userTopic, botMessagePayload);

      // Create response
      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", "Messages sent and processed successfully");

      Map<String, Object> data = new HashMap<>();
      data.put("userMessage", userMessagePayload);
      data.put("botMessage", botMessagePayload);
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

  @GetMapping("/history")
  public ResponseEntity<?> getChatHistory(Authentication authentication,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
    try {
      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        logger.error("User not found for email: {}", email);
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();
      logger.info("Fetching chat history for user: {}", user.getId());

      Optional<ChatSession> chatSessionOptional = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
        .stream()
        .findFirst();

      if (chatSessionOptional.isEmpty()) {
        return ResponseEntity.ok(createEmptyHistoryResponse());
      }

      ChatSession chatSession = chatSessionOptional.get();

      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending()); // Changed to ascending for proper order
      Page<Message> messagesPage = messageRepository.findByChatSessionOrderByCreatedAtDesc(chatSession, pageable);

      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("data", messagesPage.getContent());
      response.put("currentPage", messagesPage.getNumber());
      response.put("totalItems", messagesPage.getTotalElements());
      response.put("totalPages", messagesPage.getTotalPages());

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      logger.error("Failed to fetch chat history: {}", e.getMessage(), e);
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to fetch chat history: " + e.getMessage()));
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

  public static class SendMessageRequest {
    private String message;

    public String getMessage() {
      return message;
    }

    public void setMessage(String message) {
      this.message = message;
    }
  }
}
import com.mindease.aop.annotations.AuditChatSent;
