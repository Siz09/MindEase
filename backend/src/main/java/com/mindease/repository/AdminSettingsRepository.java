package com.mindease.repository;

import com.mindease.model.AdminSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdminSettingsRepository extends JpaRepository<AdminSettings, UUID> {
    Optional<AdminSettings> findByFeatureName(String featureName);
}

