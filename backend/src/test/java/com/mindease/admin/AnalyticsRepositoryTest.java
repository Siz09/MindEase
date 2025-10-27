package com.mindease.admin;

import com.mindease.model.AuditLog;
import com.mindease.repository.AnalyticsRepository;
import com.mindease.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class AnalyticsRepositoryTest {

    @Autowired
    AnalyticsRepository analytics;
    @Autowired
    AuditLogRepository audits;

    @Test
    void returnsDailyAiUsage() {
        var uid = UUID.randomUUID();
        // seed a few CHAT_SENT today
        for (int i = 0; i < 3; i++) {
            var a = new AuditLog();
            a.setUserId(uid);
            a.setActionType("CHAT_SENT");
            a.setDetails("x");
            audits.save(a);
        }
        var from = OffsetDateTime.now().minusDays(1);
        var to = OffsetDateTime.now().plusMinutes(1);
        var points = analytics.dailyAiUsage(from, to);
        assertThat(points).isNotEmpty();
        assertThat(points.get(points.size() - 1).calls()).isGreaterThanOrEqualTo(3);
    }
}

