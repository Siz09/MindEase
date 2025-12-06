package com.mindease.controller;

import com.mindease.auth.controller.AuthController;
import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.service.FirebaseService;
import com.mindease.auth.service.UserService;
import com.mindease.shared.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    FirebaseService firebaseService;

    @MockBean
    UserService userService;

    @MockBean
    JwtUtil jwtUtil;

    @Test
    void registerSuccess() throws Exception {
        var firebaseToken = "test-firebase-token";
        var firebaseUid = "firebase-uid";
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setRole(Role.USER);
        user.setAnonymousMode(Boolean.FALSE);

        Mockito.when(firebaseService.getUidFromToken(firebaseToken)).thenReturn(firebaseUid);
        Mockito.when(userService.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());
        Mockito.when(userService.createUser("user@example.com", Role.USER, Boolean.FALSE, firebaseUid))
                .thenReturn(user);
        Mockito.when(jwtUtil.generateToken(user)).thenReturn("jwt-token");

        var body = """
                {
                  "email": "user@example.com",
                  "firebaseToken": "test-firebase-token",
                  "anonymousMode": false
                }
                """;

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("user@example.com"));

        Mockito.verify(userService).createUser("user@example.com", Role.USER, Boolean.FALSE, firebaseUid);
    }

    @Test
    void loginUserNotFoundReturns404WithCode() throws Exception {
        var firebaseToken = "missing-user-token";
        var firebaseUid = "missing-uid";

        Mockito.when(firebaseService.getUidFromToken(firebaseToken)).thenReturn(firebaseUid);
        Mockito.when(userService.findByFirebaseUid(firebaseUid)).thenReturn(Optional.empty());

        var body = """
                {
                  "firebaseToken": "missing-user-token"
                }
                """;

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

}
