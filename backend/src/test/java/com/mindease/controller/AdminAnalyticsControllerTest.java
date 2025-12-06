package com.mindease.controller;

import com.mindease.admin.controller.AdminDashboardController;
import com.mindease.admin.dto.ActiveUsersPoint;
import com.mindease.admin.dto.AiUsagePoint;
import com.mindease.mood.dto.MoodCorrelationPoint;
import com.mindease.admin.repository.AnalyticsRepository;
import com.mindease.shared.config.MethodSecurityConfig;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(controllers = AdminDashboardController.class)
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
                .thenReturn(List.of(new ActiveUsersPoint(LocalDate.of(2025, 1, 1), 5)));
        mvc.perform(get("/api/admin/active-users").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].day").value("2025-01-01"))
                .andExpect(jsonPath("$[0].activeUsers").value(5));
        Mockito.verify(analytics).dailyActiveUsers(Mockito.any(), Mockito.any());
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
                .thenReturn(List.of(new AiUsagePoint(LocalDate.of(2025, 1, 2), 12)));
        mvc.perform(get("/api/admin/ai-usage").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].day").value("2025-01-02"))
                .andExpect(jsonPath("$[0].calls").value(12));
        Mockito.verify(analytics).dailyAiUsage(Mockito.any(), Mockito.any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void moodCorrelationOk() throws Exception {
        Mockito.when(analytics.moodCorrelation(Mockito.any(), Mockito.any()))
                .thenReturn(List.of(new MoodCorrelationPoint(LocalDate.of(2025, 1, 3), 3.7, 20)));
        mvc.perform(get("/api/admin/mood-correlation").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].day").value("2025-01-03"))
                .andExpect(jsonPath("$[0].avgMood").value(3.7))
                .andExpect(jsonPath("$[0].chatCount").value(20));
        Mockito.verify(analytics).moodCorrelation(Mockito.any(), Mockito.any());
    }
}
