package com.mindease.config;

import com.mindease.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collections;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  @Autowired
  private JwtUtil jwtUtil;

  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    config.enableSimpleBroker("/topic");
    config.setApplicationDestinationPrefixes("/app");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
      .setAllowedOriginPatterns("*")
      .withSockJS();
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new ChannelInterceptor() {
      @Override
      public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
          String token = accessor.getFirstNativeHeader("Authorization");
          if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
              // Use the validateToken method that only takes the token
              if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                if (username != null) {
                  UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
                  accessor.setUser(auth);
                  System.out.println("WebSocket authenticated user: " + username);
                }
              }
            } catch (Exception e) {
              System.err.println("WebSocket authentication failed: " + e.getMessage());
              // Don't throw exception to avoid connection failure logs
            }
          } else {
            System.err.println("No Authorization header found in WebSocket connection");
          }
        }
        return message;
      }
    });
  }
}
