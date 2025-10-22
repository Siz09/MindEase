package com.mindease.repository;

import com.mindease.model.AdminSettings;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class AdminSettingsRepositoryTest {

    @Autowired
    private AdminSettingsRepository repo;

    @Test
    void saveAndFindByFeatureName() {
        AdminSettings s = new AdminSettings();
        s.setFeatureName("CRISIS_EMAIL_ALERTS_TEST");
        s.setEnabled(true);
        repo.save(s);

        var found = repo.findByFeatureName("CRISIS_EMAIL_ALERTS_TEST");
        assertThat(found).isPresent();
        assertThat(found.get().isEnabled()).isTrue();
    }
}
