package com.mindease.repository;

import com.mindease.dto.CrisisStatsResponse;
import com.mindease.dto.KeywordStat;
import com.mindease.model.CrisisFlag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT new com.mindease.dto.CrisisStatsResponse(" +
           "SUM(CASE WHEN f.riskScore >= 0.08 THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN f.riskScore >= 0.05 AND f.riskScore < 0.08 THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN (f.riskScore < 0.05 OR f.riskScore IS NULL) THEN 1 ELSE 0 END)) " +
           "FROM CrisisFlag f WHERE f.createdAt BETWEEN :from AND :to")
    CrisisStatsResponse computeStats(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("SELECT new com.mindease.dto.KeywordStat(LOWER(f.keywordDetected), COUNT(f)) " +
           "FROM CrisisFlag f " +
           "WHERE f.createdAt BETWEEN :from AND :to " +
           "AND f.keywordDetected IS NOT NULL " +
           "AND f.keywordDetected <> '' " +
           "GROUP BY LOWER(f.keywordDetected) " +
           "ORDER BY COUNT(f) DESC")
    List<KeywordStat> findTopKeywords(@Param("from") OffsetDateTime from,
                                      @Param("to") OffsetDateTime to,
                                      Pageable pageable);

    @Query("SELECT f.userId, COUNT(f) FROM CrisisFlag f WHERE f.userId IN :userIds GROUP BY f.userId")
    List<Object[]> countByUserIdIn(@Param("userIds") List<UUID> userIds);

    default List<CrisisFlag> findTopNByOrderByCreatedAtDesc(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return findAll(pageable).getContent();
    }
}
