package com.mindease.journal.repository;

import com.mindease.journal.model.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    // Paginated results for performance
    @EntityGraph(attributePaths = { "moodEntry" })
    Page<JournalEntry> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // For infinite scroll - get entries before a certain date
    List<JournalEntry> findByUserIdAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID userId, LocalDateTime createdAt, Pageable pageable);

    // Count entries for a user (for pagination info)
    long countByUserId(UUID userId);

    // Count entries for a user in current month
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.userId = :userId AND j.createdAt >= :startOfMonth")
    long countByUserIdAndCreatedAtAfter(@Param("userId") UUID userId, @Param("startOfMonth") LocalDateTime startOfMonth);

    // Count entries for a user today
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.userId = :userId AND j.createdAt >= :startOfDay AND j.createdAt < :endOfDay")
    long countByUserIdAndCreatedAtBetween(@Param("userId") UUID userId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    // Count entries with AI summaries for a user in current month
    // Excludes entries with placeholder messages indicating limit reached
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.userId = :userId AND j.aiSummary IS NOT NULL AND j.aiSummary != '' AND j.createdAt >= :startOfMonth AND j.aiSummary NOT LIKE 'AI summaries are limited%'")
    long countByUserIdWithAISummaryAndCreatedAtAfter(@Param("userId") UUID userId, @Param("startOfMonth") LocalDateTime startOfMonth);

    // Get recent entries for dashboard (limited to 5 most recent)
    @EntityGraph(attributePaths = { "moodEntry" })
    List<JournalEntry> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Bulk delete for memory-efficient cleanup operations.
     *
     * NOTE: Transaction management should be handled at the service layer.
     * The calling service method must be annotated with @Transactional.
     */
    @Query("DELETE FROM JournalEntry j WHERE j.userId = :userId")
    @Modifying
    int deleteByUserId(@Param("userId") UUID userId);
}
