package com.mindease.repository;

import com.mindease.crisis.model.CrisisFlag;
import com.mindease.crisis.repository.CrisisFlagRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CrisisFlagRepositoryTest {

    @Autowired
    private CrisisFlagRepository repo;

    @Test
    void saveAndFindLatest() {
        UUID userId = UUID.randomUUID();
        UUID chatId = UUID.randomUUID();

        CrisisFlag flag = new CrisisFlag();
        flag.setUserId(userId);
        flag.setChatId(chatId);
        flag.setKeywordDetected("self-harm");
        repo.save(flag);

        var latest = repo.findTop1ByUserIdOrderByCreatedAtDesc(userId);
        assertThat(latest).isPresent();
        assertThat(latest.get().getKeywordDetected()).isEqualTo("self-harm");
    }
}
