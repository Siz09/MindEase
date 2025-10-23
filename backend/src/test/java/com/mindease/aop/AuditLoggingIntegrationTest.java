package com.mindease.aop;

import com.mindease.model.AuditLog;
import com.mindease.repository.AuditLogRepository;
import com.mindease.service.AuditService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

@SpringBootTest
class AuditLoggingIntegrationTest {

    @Autowired
    private AuditService auditService;

    @MockBean
    private AuditLogRepository repo;

    @Test
    void asyncAuditWriteInvokesRepositorySave() {
        UUID userId = UUID.randomUUID();

        auditService.moodAdded(userId);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repo, timeout(1500)).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getActionType()).isEqualTo("MOOD_ADDED");
        assertThat(saved.getDetails()).isNotNull();
    }
}

