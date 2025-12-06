package com.mindease.controller;

import com.mindease.auth.service.UserService;
import com.mindease.journal.controller.JournalController;
import com.mindease.journal.model.JournalEntry;
import com.mindease.journal.service.JournalService;
import com.mindease.shared.util.AuthUtil;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = JournalController.class)
class JournalControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    JournalService journalService;

    @MockBean
    UserService userService;

    @MockBean
    AuthUtil authUtil;

    @Test
    @WithMockUser(username = "user@example.com")
    void addJournalEntryRejectsEmptyContent() throws Exception {
        var body = """
                {
                  "title": "Test",
                  "content": "   "
                }
                """;

        mvc.perform(post("/api/journal/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Journal content cannot be empty"));
    }

    @Test
    void aiStatusReflectsServiceAvailability() throws Exception {
        Mockito.when(journalService.isAIAvailable()).thenReturn(true);

        mvc.perform(get("/api/journal/ai-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.aiAvailable").value(true));
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void addJournalEntrySuccess() throws Exception {
        var userId = UUID.randomUUID();
        Mockito.when(authUtil.getCurrentUserId()).thenReturn(userId);

        var entry = new JournalEntry();
        entry.setId(UUID.randomUUID());
        entry.setUserId(userId);
        entry.setContent("Hello world");

        Mockito.when(journalService.saveJournalEntry(userId, "My Title", "Hello world"))
                .thenReturn(entry);
        Mockito.when(journalService.isAIAvailable()).thenReturn(true);

        var body = """
                {
                  "title": "My Title",
                  "content": "Hello world"
                }
                """;

        mvc.perform(post("/api/journal/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.entry.content").value("Hello world"))
                .andExpect(jsonPath("$.aiAvailable").value(true));
    }
}
