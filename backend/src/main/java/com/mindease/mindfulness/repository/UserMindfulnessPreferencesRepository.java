package com.mindease.mindfulness.repository;

import com.mindease.auth.model.User;
import com.mindease.mindfulness.model.UserMindfulnessPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserMindfulnessPreferencesRepository extends JpaRepository<UserMindfulnessPreferences, UUID> {
    Optional<UserMindfulnessPreferences> findByUser(User user);
    Optional<UserMindfulnessPreferences> findByUserId(UUID userId);
}
