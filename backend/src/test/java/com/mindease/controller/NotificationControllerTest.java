package com.mindease.controller;

import com.mindease.auth.model.User;
import com.mindease.auth.service.UserService;
import com.mindease.notification.controller.NotificationController;
import com.mindease.notification.model.Notification;
import com.mindease.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
class NotificationControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    NotificationRepository notificationRepository;

    @MockBean
    UserService userService;

    @Test
    @WithMockUser(username = "user@example.com")
    void listNotificationsReturnsPage() throws Exception {
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");

        var notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUser(user);
        notification.setCreatedAt(java.time.LocalDateTime.now());

        Mockito.when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Pageable pageable = PageRequest.of(0, 10);
        Mockito.when(notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable))
                .thenReturn(new PageImpl<>(List.of(notification), pageable, 1));

        mvc.perform(get("/api/notifications/list")
                        .param("page", "0")
                        .param("size", "10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void unreadCountReturnsNumber() throws Exception {
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");

        Mockito.when(userService.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        Mockito.when(notificationRepository.countByUserAndIsReadFalse(user)).thenReturn(3L);

        mvc.perform(get("/api/notifications/unread-count")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));
    }
}
