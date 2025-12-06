package com.mindease.controller;

import com.mindease.admin.controller.AdminAuditController;
import com.mindease.admin.model.AuditLog;
import com.mindease.admin.repository.AuditLogRepository;
import com.mindease.shared.config.MethodSecurityConfig;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminAuditController.class)
@Import(MethodSecurityConfig.class)
class AdminAuditControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    AuditLogRepository repo;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanList() throws Exception {
        var pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        var slice = new SliceImpl<>(List.of(new AuditLog()), pageable, false);
        Mockito.when(repo.findByFilters(null, null, null, null, pageable)).thenReturn(slice);

        mvc.perform(get("/api/admin/audit-logs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser // not admin
    void nonAdminForbidden() throws Exception {
        mvc.perform(get("/api/admin/audit-logs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void bubblesUpServerError() throws Exception {
        var pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        Mockito.when(
                repo.findByFilters(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.eq(pageable)))
                .thenThrow(new RuntimeException("boom"));

        mvc.perform(get("/api/admin/audit-logs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is5xxServerError());
    }
}
