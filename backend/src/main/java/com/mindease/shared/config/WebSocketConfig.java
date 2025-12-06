package com.mindease.shared.config;

import com.mindease.shared.filter.WebSocketRateLimitingInterceptor;
import com.mindease.shared.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private WebSocketRateLimitingInterceptor rateLimitingInterceptor;

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
        // Add rate limiting interceptor first
        registration.interceptors(rateLimitingInterceptor);

        // Then add authentication interceptor
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();

                // Authenticate on CONNECT
                if (StompCommand.CONNECT.equals(command)) {
                    String token = accessor.getFirstNativeHeader("Authorization");

                    if (token == null || !token.startsWith("Bearer ")) {
                        logger.warn("WebSocket CONNECT rejected: No valid Authorization header");
                        throw new IllegalArgumentException("Missing or invalid Authorization header");
                    }

                    token = token.substring(7);

                    try {
                        // Validate token and check expiration
                        if (!jwtUtil.validateToken(token)) {
                            logger.warn("WebSocket CONNECT rejected: Invalid token");
                            throw new IllegalArgumentException("Invalid JWT token");
                        }

                        String username = jwtUtil.extractUsername(token);
                        if (username == null || username.isEmpty()) {
                            logger.warn("WebSocket CONNECT rejected: No username in token");
                            throw new IllegalArgumentException("Invalid token: no username");
                        }

                        // Set authenticated user
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username,
                                null, Collections.emptyList());
                        accessor.setUser(auth);

                        logger.info("WebSocket authenticated user: {}", username);

                    } catch (ExpiredJwtException e) {
                        logger.warn("WebSocket CONNECT rejected: Token expired for user");
                        throw new IllegalArgumentException(
                                "JWT token has expired. Please refresh your token and reconnect.");
                    } catch (Exception e) {
                        logger.error("WebSocket authentication failed: {}", e.getMessage());
                        throw new IllegalArgumentException("Authentication failed: " + e.getMessage());
                    }
                }

                // Validate token on every MESSAGE (not just CONNECT)
                if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
                    if (accessor.getUser() == null) {
                        logger.warn("WebSocket {} rejected: User not authenticated", command);
                        throw new IllegalArgumentException("User not authenticated");
                    }
                }

                return message;
            }
        });
    }
}
