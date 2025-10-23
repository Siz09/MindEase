package com.mindease.repository;

import com.mindease.model.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:auditlogtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE"
})
class AuditLogRepositoryImplTest {

    @Autowired
    AuditLogRepository repo;

    @Test
    void filtersWorkInAnyCombination() {
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();

        for (int i = 0; i < 3; i++) {
            AuditLog a = new AuditLog();
            a.setUserId(u1);
            a.setActionType("LOGIN");
            a.setDetails("x" + i);
            repo.save(a);
        }
        AuditLog other = new AuditLog();
        other.setUserId(u2);
        other.setActionType("CHAT_SENT");
        other.setDetails("y");
        repo.save(other);

        var pageable = PageRequest.of(0, 2);

        Slice<AuditLog> byUser = repo.findByFilters(u1, null, null, null, pageable);
        assertThat(byUser.getContent()).isNotEmpty();
        assertThat(byUser.getContent()).allMatch(a -> u1.equals(a.getUserId()));

        Slice<AuditLog> byAction = repo.findByFilters(null, "CHAT_SENT", null, null, pageable);
        assertThat(byAction.getContent()).isNotEmpty();
        assertThat(byAction.getContent()).allMatch(a -> "CHAT_SENT".equals(a.getActionType()));

        var from = OffsetDateTime.now().minusDays(1);
        var to = OffsetDateTime.now().plusDays(1);
        Slice<AuditLog> combo = repo.findByFilters(u1, "LOGIN", from, to, pageable);
        assertThat(combo.getContent()).isNotEmpty();
        assertThat(combo.getContent()).allMatch(a -> u1.equals(a.getUserId()) && "LOGIN".equals(a.getActionType()));
    }
}

