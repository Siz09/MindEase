package com.mindease.controller;

import com.mindease.config.MethodSecurityConfig;
import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.AiUsagePoint;
import com.mindease.dto.MoodCorrelationPoint;
import com.mindease.repository.AnalyticsRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminAnalyticsController.class)
@Import(MethodSecurityConfig.class)
class AdminAnalyticsControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    AnalyticsRepository analytics;

    @Test
    @WithMockUser(roles = "ADMIN")
    void activeUsersOk() throws Exception {
        Mockito.when(analytics.dailyActiveUsers(Mockito.any(), Mockito.any()))
                .thenReturn(List.of(new ActiveUsersPoint(LocalDate.now(), 5)));
        mvc.perform(get("/api/admin/active-users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser // not admin
    void nonAdminForbidden() throws Exception {
        mvc.perform(get("/api/admin/active-users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void aiUsageOk() throws Exception {
        Mockito.when(analytics.dailyAiUsage(Mockito.any(), Mockito.any()))
                .thenReturn(List.of(new AiUsagePoint(LocalDate.now(), 12)));
        mvc.perform(get("/api/admin/ai-usage").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void moodCorrelationOk() throws Exception {
        Mockito.when(analytics.moodCorrelation(Mockito.any(), Mockito.any()))
                .thenReturn(List.of(new MoodCorrelationPoint(LocalDate.now(), 3.7, 20)));
        mvc.perform(get("/api/admin/mood-correlation").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}

