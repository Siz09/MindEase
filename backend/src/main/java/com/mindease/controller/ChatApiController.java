package com.mindease.controller;

import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.repository.ChatSessionRepository;
import com.mindease.repository.MessageRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

// Add these imports at the top
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/chat")
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
  private SimpMessagingTemplate messagingTemplate;

  // Add logger
  private static final Logger logger = LoggerFactory.getLogger(ChatApiController.class);

  @PostMapping("/send")
  public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request, Authentication authentication) {
    try {
      logger.info("Received message request: {}", request.getMessage());

      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        logger.error("User not found for email: {}", email);
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();
      logger.info("Processing message for user: {}", user.getId());

      // Get or create chat session
      ChatSession chatSession = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
        .stream()
        .findFirst()
        .orElseGet(() -> chatSessionRepository.save(new ChatSession(user)));

      chatSession.setUpdatedAt(java.time.LocalDateTime.now());
      chatSessionRepository.save(chatSession);

      // Check for crisis
      boolean isCrisis = chatBotService.isCrisisMessage(request.getMessage());

      // Save user message
      Message userMessage = new Message(chatSession, request.getMessage(), true);
      userMessage.setIsCrisisFlagged(isCrisis);
      messageRepository.save(userMessage);

      // Add logging before sending user message
      logger.info("Sending user message to topic: /topic/user/{}", user.getId());
      Map<String, Object> userMessagePayload = new HashMap<>();
      userMessagePayload.put("id", userMessage.getId());
      userMessagePayload.put("content", userMessage.getContent() != null ? userMessage.getContent() : "");
      userMessagePayload.put("isUserMessage", true);
      userMessagePayload.put("isCrisisFlagged", isCrisis);
      userMessagePayload.put("createdAt", userMessage.getCreatedAt());
      userMessagePayload.put("type", "message");
      userMessagePayload.put("sender", "user");

      messagingTemplate.convertAndSend("/topic/user/" + user.getId(), userMessagePayload);

      // Crisis response
      if (isCrisis) {
        String crisisResponse = "I'm concerned about what you're sharing. Please consider contacting a mental health professional or a crisis helpline immediately.";
        Message crisisMessage = new Message(chatSession, crisisResponse, false);
        crisisMessage.setIsCrisisFlagged(true);
        messageRepository.save(crisisMessage);

        Map<String, Object> crisisMessagePayload = new HashMap<>();
        crisisMessagePayload.put("id", crisisMessage.getId());
        crisisMessagePayload.put("content", crisisMessage.getContent() != null ? crisisMessage.getContent() : "");
        crisisMessagePayload.put("isUserMessage", false);
        crisisMessagePayload.put("isCrisisFlagged", true);
        crisisMessagePayload.put("createdAt", crisisMessage.getCreatedAt());
        crisisMessagePayload.put("type", "message");
        crisisMessagePayload.put("sender", "bot");
        crisisMessagePayload.put("isCrisisResponse", true);

        logger.info("Sending crisis message to topic: /topic/user/{}", user.getId());
        messagingTemplate.convertAndSend("/topic/user/" + user.getId(), crisisMessagePayload);
      }

      // AI bot response
      String aiResponse = chatBotService.generateResponse(request.getMessage(), user.getId().toString());
      Message botMessage = new Message(chatSession, aiResponse, false);
      messageRepository.save(botMessage);

      Map<String, Object> botMessagePayload = new HashMap<>();
      botMessagePayload.put("id", botMessage.getId());
      botMessagePayload.put("content", botMessage.getContent() != null ? botMessage.getContent() : "");
      botMessagePayload.put("isUserMessage", false);
      botMessagePayload.put("isCrisisFlagged", botMessage.getIsCrisisFlagged());
      botMessagePayload.put("createdAt", botMessage.getCreatedAt());
      botMessagePayload.put("type", "message");
      botMessagePayload.put("sender", "bot");

      logger.info("Sending bot message to topic: /topic/user/{}", user.getId());
      messagingTemplate.convertAndSend("/topic/user/" + user.getId(), botMessagePayload);

      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", "Message sent and processed");
      response.put("userMessage", userMessagePayload);
      response.put("botMessage", botMessagePayload);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      logger.error("Error sending message: {}", e.getMessage(), e);
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

      Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
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
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
  }
}
