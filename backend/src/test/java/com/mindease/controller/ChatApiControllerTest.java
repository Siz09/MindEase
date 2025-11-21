package com.mindease.controller;

import com.mindease.config.ChatConfig;
import com.mindease.model.ChatSession;
import com.mindease.model.Message;
import com.mindease.model.User;
import com.mindease.repository.ChatSessionRepository;
import com.mindease.repository.MessageRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.ChatBotService;
import com.mindease.service.CrisisFlaggingService;
import com.mindease.service.PremiumAccessService;
import com.mindease.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatApiController.class)
class ChatApiControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    ChatSessionRepository chatSessionRepository;

    @MockBean
    MessageRepository messageRepository;

    @MockBean
    UserRepository userRepository;

    @MockBean
    ChatBotService chatBotService;

    @MockBean
    UserService userService;

    @MockBean
    SimpMessagingTemplate messagingTemplate;

    @MockBean
    CrisisFlaggingService crisisFlaggingService;

    @MockBean
    PremiumAccessService premiumAccessService;

    @MockBean
    ChatConfig chatConfig;

    @Test
    @WithMockUser(username = "missing@example.com")
    void sendMessageReturnsBadRequestWhenUserMissing() throws Exception {
        Mockito.when(userRepository.findByEmail("missing@example.com"))
                .thenReturn(Optional.empty());

        var body = """
                {
                  "message": "Hello"
                }
                """;

        mvc.perform(post("/api/chat/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("User not found"));
    }
}
