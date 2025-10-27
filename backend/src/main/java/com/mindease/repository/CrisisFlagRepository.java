package com.mindease.repository;

import com.mindease.model.CrisisFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CrisisFlagRepository extends JpaRepository<CrisisFlag, UUID> {
    List<CrisisFlag> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<CrisisFlag> findTop1ByUserIdOrderByCreatedAtDesc(UUID userId);
    boolean existsByChatIdAndKeywordDetectedIgnoreCase(UUID chatId, String keywordDetected);

    Page<CrisisFlag> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<CrisisFlag> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime from, OffsetDateTime to, Pageable pageable);
}
