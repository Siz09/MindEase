package com.mindease.controller;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.shared.security.CustomUserDetails;
import com.mindease.subscription.service.SubscriptionService;
import com.mindease.subscription.controller.SubscriptionController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SubscriptionControllerTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void status_endpoint_returns_normalized_status() {
        SubscriptionService service = mock(SubscriptionService.class);
        when(service.findLatestStatusForUser(any(UUID.class))).thenReturn("active");

        // Auth context
        UUID uid = UUID.randomUUID();
        User u = new User();
        u.setId(uid);
        u.setEmail("test@example.com");
        u.setRole(Role.USER);
        var cud = new CustomUserDetails(u);
        var auth = new UsernamePasswordAuthenticationToken(
                cud,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        SubscriptionController ctrl = new SubscriptionController(service);
        ResponseEntity<Map<String, String>> res = ctrl.status();

        assertThat(res.getStatusCodeValue()).isEqualTo(200);
        assertThat(res.getBody()).containsEntry("status", "active");
    }
}
