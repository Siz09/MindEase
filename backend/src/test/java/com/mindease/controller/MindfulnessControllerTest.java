package com.mindease.controller;

import com.mindease.mindfulness.controller.MindfulnessController;
import com.mindease.mindfulness.model.MindfulnessSession;
import com.mindease.mindfulness.service.MindfulnessService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MindfulnessController.class)
class MindfulnessControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    MindfulnessService mindfulnessService;

    @Test
    void listSessionsFiltersByType() throws Exception {
        var session = new MindfulnessSession();
        session.setTitle("Breathing exercise");
        session.setType("breathing");

        Mockito.when(mindfulnessService.getSessionsByType("breathing"))
                .thenReturn(List.of(session));
        Mockito.when(mindfulnessService.getAllCategories())
                .thenReturn(List.of("breathing"));

        mvc.perform(get("/api/mindfulness/list")
                        .param("type", "breathing")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.sessions[0].title").value("Breathing exercise"))
                .andExpect(jsonPath("$.categories[0]").value("breathing"));
    }
}
