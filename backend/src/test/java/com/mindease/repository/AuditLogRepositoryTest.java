package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class AuditLogRepositoryTest {

    @Autowired
    private AuditLogRepository repo;

    @Test
    void saveAndQueryByUser() {
        UUID userId = UUID.randomUUID();

        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setActionType("LOGIN");
        log.setDetails("User logged in");
        repo.save(log);

        List<AuditLog> found = repo.findByUserIdOrderByCreatedAtDesc(userId);
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getActionType()).isEqualTo("LOGIN");

        var from = OffsetDateTime.now().minusDays(1);
        var to = OffsetDateTime.now().plusDays(1);
        var filtered = repo.findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                userId, "LOGIN", from, to
        );
        assertThat(filtered).hasSize(1);
    }
}

