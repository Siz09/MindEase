// backend/src/main/java/com/mindease/filter/JwtAuthenticationFilter.java
package com.mindease.filter;

import com.mindease.service.CustomUserDetailsService;
import com.mindease.util.JwtUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // 1) Standard Authorization: Bearer <token>
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                logger.warn("JWT token validation failed: " + e.getMessage());
            }
        }

        // 2) Fallback for SSE where custom headers aren't available.
        // EventSource API cannot send custom headers, so we must accept JWT from
        // cookie (preferred) or query param for the crisis-flags stream endpoint.
        // This is necessary in all environments, not just dev, due to EventSource
        // limitations.
        if (username == null) {
            String uri = request.getRequestURI();
            if (uri != null && (uri.equals("/api/admin/crisis-flags/stream"))) {
                // Try cookie first (less exposure than query params)
                String cookieToken = null;
                Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (Cookie c : cookies) {
                        if (c != null && "ADMIN_JWT".equals(c.getName()) && c.getValue() != null
                                && !c.getValue().isBlank()) {
                            cookieToken = c.getValue();
                            break;
                        }
                    }
                }
                if (cookieToken != null) {
                    jwt = cookieToken;
                    try {
                        username = jwtUtil.extractUsername(jwt);
                    } catch (Exception e) {
                        logger.warn("JWT (cookie) validation failed: " + e.getMessage());
                    }
                }

                // Fallback to query param if cookie isn't present
                if (username == null) {
                    String qpToken = request.getParameter("access_token");
                    if (qpToken == null || qpToken.isBlank()) {
                        qpToken = request.getParameter("token");
                    }
                    if (qpToken != null && !qpToken.isBlank()) {
                        jwt = qpToken.trim();
                        try {
                            username = jwtUtil.extractUsername(jwt);
                        } catch (Exception e) {
                            logger.warn("JWT (query param) validation failed: " + e.getMessage());
                        }
                    }
                }
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        chain.doFilter(request, response);
    }
}
