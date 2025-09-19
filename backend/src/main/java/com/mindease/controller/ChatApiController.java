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
import java.util.UUID;

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

  // POST /api/chat/send - Send a chat message
  @PostMapping("/send")
  public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request, Authentication authentication) {
    try {
      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();

      // For simplicity, we'll use the first chat session or create a new one if none exists
      ChatSession chatSession = chatSessionRepository.findByUserOrderByUpdatedAtDesc(user)
        .stream()
        .findFirst()
        .orElseGet(() -> {
          ChatSession newSession = new ChatSession(user);
          return chatSessionRepository.save(newSession);
        });

      // Update the chat session's updatedAt timestamp
      chatSession.setUpdatedAt(java.time.LocalDateTime.now());
      chatSessionRepository.save(chatSession);

      // Check for crisis keywords
      boolean isCrisis = chatBotService.isCrisisMessage(request.getMessage());

      // Save the user's message
      Message userMessage = new Message(chatSession, request.getMessage(), true);
      userMessage.setIsCrisisFlagged(isCrisis);
      messageRepository.save(userMessage);

      // Broadcast the user's message via WebSocket
      Map<String, Object> userMessagePayload = new HashMap<>();
      userMessagePayload.put("id", userMessage.getId());
      userMessagePayload.put("content", userMessage.getContent());
      userMessagePayload.put("isUserMessage", userMessage.getIsUserMessage());
      userMessagePayload.put("isCrisisFlagged", userMessage.getIsCrisisFlagged());
      userMessagePayload.put("createdAt", userMessage.getCreatedAt());

      messagingTemplate.convertAndSend("/topic/" + chatSession.getId(), userMessagePayload);

      // Prepare response map
      Map<String, Object> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", "Message sent and processed");
      response.put("userMessage", userMessagePayload);

      // Update the sendMessage method to include crisis response
      if (isCrisis) {
        String crisisResponse = "I'm really concerned about what you're sharing. " +
          "It's important to talk to a mental health professional who can provide proper support. " +
          "Please consider reaching out to a crisis helpline or mental health service immediately. " +
          "You can contact the National Suicide Prevention Lifeline at 1-800-273-8255 " +
          "or text HOME to 741741 to reach the Crisis Text Line. " +
          "You don't have to go through this alone.";

        // Save the crisis response
        Message crisisMessage = new Message(chatSession, crisisResponse, false);
        crisisMessage.setIsCrisisFlagged(true);
        messageRepository.save(crisisMessage);

        // Broadcast the crisis response via WebSocket
        Map<String, Object> crisisMessagePayload = new HashMap<>();
        crisisMessagePayload.put("id", crisisMessage.getId());
        crisisMessagePayload.put("content", crisisMessage.getContent());
        crisisMessagePayload.put("isUserMessage", crisisMessage.getIsUserMessage());
        crisisMessagePayload.put("isCrisisFlagged", crisisMessage.getIsCrisisFlagged());
        crisisMessagePayload.put("createdAt", crisisMessage.getCreatedAt());
        crisisMessagePayload.put("isCrisisResponse", true);

        messagingTemplate.convertAndSend("/topic/" + chatSession.getId(), crisisMessagePayload);

        // Add the crisis message to the response
        response.put("crisisMessage", crisisMessagePayload);
        response.put("crisisDetected", true);
      }

      // Generate AI response (still sent even if crisis detected)
      String aiResponse = chatBotService.generateResponse(request.getMessage(), user.getId().toString());

      // Save the AI response
      Message botMessage = new Message(chatSession, aiResponse, false);
      messageRepository.save(botMessage);

      // Broadcast the AI response via WebSocket
      Map<String, Object> botMessagePayload = new HashMap<>();
      botMessagePayload.put("id", botMessage.getId());
      botMessagePayload.put("content", botMessage.getContent());
      botMessagePayload.put("isUserMessage", botMessage.getIsUserMessage());
      botMessagePayload.put("isCrisisFlagged", botMessage.getIsCrisisFlagged());
      botMessagePayload.put("createdAt", botMessage.getCreatedAt());

      messagingTemplate.convertAndSend("/topic/" + chatSession.getId(), botMessagePayload);

      response.put("botMessage", botMessagePayload);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return ResponseEntity.badRequest().body(createErrorResponse("Failed to send message: " + e.getMessage()));
    }
  }

  // GET /api/chat/history - Get chat history for the current user's chat session
  @GetMapping("/history")
  public ResponseEntity<?> getChatHistory(
    Authentication authentication,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {
    try {
      String email = authentication.getName();
      Optional<User> userOptional = userRepository.findByEmail(email);

      if (userOptional.isEmpty()) {
        return ResponseEntity.badRequest().body(createErrorResponse("User not found"));
      }

      User user = userOptional.get();

      // Get the most recent chat session for the user
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

  // Request DTO for sending a message
  public static class SendMessageRequest {
    private String message;

    // Getters and setters
    public String getMessage() {
      return message;
    }

    public void setMessage(String message) {
      this.message = message;
    }
  }
}
