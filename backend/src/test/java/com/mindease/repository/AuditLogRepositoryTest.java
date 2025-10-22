package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class AuditLogRepositoryTest {

    @Autowired
    private AuditLogRepository repo;

    @Test
    void saveAndQueryWithPagination() {
        UUID userId = UUID.randomUUID();

        for (int i = 0; i < 3; i++) {
            AuditLog log = new AuditLog();
            log.setUserId(userId);
            log.setActionType("LOGIN");
            log.setDetails("User logged in #" + i);
            repo.save(log);
        }

        var page = repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 2));
        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);

        var from = OffsetDateTime.now().minusDays(1);
        var to = OffsetDateTime.now().plusDays(1);
        var slice = repo.findByUserIdAndActionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                userId, "LOGIN", from, to, PageRequest.of(0, 2));
        assertThat(slice.getContent().size()).isGreaterThanOrEqualTo(1);
    }
}
