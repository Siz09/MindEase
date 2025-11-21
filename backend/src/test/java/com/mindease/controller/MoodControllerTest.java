package com.mindease.controller;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodEntryRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MoodController.class)
class MoodControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    MoodEntryRepository moodEntryRepository;

    @MockBean
    UserRepository userRepository;

    @MockBean
    UserService userService;

    @Test
    @WithMockUser(username = "user@example.com")
    void addMoodEntryRejectsOutOfRangeValue() throws Exception {
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");

        Mockito.when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        var body = """
                {
                  "moodValue": 12,
                  "notes": "too high"
                }
                """;

        mvc.perform(post("/api/mood/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Mood value must be between 1 and 10"));
    }

    @Test
    @WithMockUser(username = "user@example.com")
    void getMoodHistoryReturnsPagedData() throws Exception {
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");

        var entry = new MoodEntry();
        entry.setId(UUID.randomUUID());
        entry.setMoodValue(5);
        entry.setCreatedAt(java.time.LocalDateTime.now());

        Mockito.when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        Mockito.when(moodEntryRepository.findByUserOrderByCreatedAtDesc(user, pageable))
                .thenReturn(new PageImpl<>(List.of(entry), pageable, 1));

        mvc.perform(get("/api/mood/history")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].moodValue").value(5));
    }
}
