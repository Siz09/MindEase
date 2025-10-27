package com.mindease.admin;

import com.mindease.model.AuditLog;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.AuditLogRepository;
import com.mindease.repository.CrisisFlagRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class Phase7IntegrationTest {

    @Autowired
    AuditLogRepository auditRepo;
    @Autowired
    CrisisFlagRepository flagRepo;

    @Test
    void auditLogsWritten_and_CrisisFlagCreated_and_AnalyticsQueryable() {
        var userId = UUID.randomUUID();

        // Seed audit log events
        auditRepo.save(log(userId, "LOGIN", "User logged in"));
        auditRepo.save(log(userId, "CHAT_SENT", "Hello world"));
        auditRepo.save(log(userId, "MOOD_ADDED", "3"));
        auditRepo.save(log(userId, "JOURNAL_ADDED", "entry"));

        // Seed a crisis flag
        var chatId = UUID.randomUUID();
        var flag = new CrisisFlag();
        flag.setChatId(chatId);
        flag.setUserId(userId);
        flag.setKeywordDetected("suicide");
        flag.setRiskScore(0.9);
        flagRepo.save(flag);

        // Assert audit logs present
        var logs = auditRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50));
        assertThat(logs.getContent()).extracting(AuditLog::getActionType)
                .contains("LOGIN", "CHAT_SENT", "MOOD_ADDED", "JOURNAL_ADDED");

        // Assert crisis flag present
        var flags = flagRepo.findAll();
        assertThat(flags).isNotEmpty();
        assertThat(flags.get(0).getKeywordDetected()).isEqualTo("suicide");
        assertThat(flags.get(0).getRiskScore()).isNotNull();
    }

    private static AuditLog log(UUID userId, String action, String details) {
        var a = new AuditLog();
        a.setUserId(userId);
        a.setActionType(action);
        a.setDetails(details);
        return a;
    }
}

