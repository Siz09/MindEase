package com.mindease.controller;

import com.mindease.model.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatHandler {

  // Handle messages sent to /app/chat.send
  @MessageMapping("/chat.send")
  @SendTo("/topic/public")
  public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
    return chatMessage;
  }

  // Handle new user joining
  @MessageMapping("/chat.addUser")
  @SendTo("/topic/public")
  public ChatMessage addUser(@Payload ChatMessage chatMessage,
                             SimpMessageHeaderAccessor headerAccessor) {
    // Add username in web socket session
    headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
    return chatMessage;
  }
}
