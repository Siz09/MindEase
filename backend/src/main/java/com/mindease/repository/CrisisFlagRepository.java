package com.mindease.repository;

import com.mindease.model.CrisisFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    long countByCreatedAtBetween(OffsetDateTime from, OffsetDateTime to);

    long countByUserId(UUID userId);

    default List<CrisisFlag> findTopNByOrderByCreatedAtDesc(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(pageable).getContent();
    }
}
