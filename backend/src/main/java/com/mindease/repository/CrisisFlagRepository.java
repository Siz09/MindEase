package com.mindease.repository;

import com.mindease.model.CrisisFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CrisisFlagRepository extends JpaRepository<CrisisFlag, UUID> {
    List<CrisisFlag> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<CrisisFlag> findTop1ByUserIdOrderByCreatedAtDesc(UUID userId);
    boolean existsByChatIdAndKeywordDetectedIgnoreCase(UUID chatId, String keywordDetected);
}
