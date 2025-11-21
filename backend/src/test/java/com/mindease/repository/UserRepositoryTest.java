package com.mindease.repository;

import com.mindease.model.Role;
import com.mindease.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    UserRepository userRepository;

    @Test
    void saveAndFindByEmailRoundTrip() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("repo-test@example.com");
        user.setRole(Role.USER);

        userRepository.save(user);

        var loaded = userRepository.findByEmail("repo-test@example.com");
        assertThat(loaded).isPresent();
        assertThat(loaded.get().getId()).isEqualTo(user.getId());
    }
}
