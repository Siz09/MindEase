package com.mindease.repository;

import com.mindease.model.User;
import com.mindease.model.UserMindfulnessPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserMindfulnessPreferencesRepository extends JpaRepository<UserMindfulnessPreferences, UUID> {
    Optional<UserMindfulnessPreferences> findByUser(User user);
    Optional<UserMindfulnessPreferences> findByUserId(UUID userId);
}
