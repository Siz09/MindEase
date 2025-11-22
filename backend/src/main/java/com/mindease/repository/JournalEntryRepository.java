package com.mindease.repository;

import com.mindease.model.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    Page<JournalEntry> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // For infinite scroll - get entries before a certain date
    List<JournalEntry> findByUserIdAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID userId, LocalDateTime createdAt, Pageable pageable);

    // Count entries for a user (for pagination info)
    long countByUserId(UUID userId);

    // Get recent entries for dashboard
    @Query("SELECT j FROM JournalEntry j WHERE j.userId = :userId ORDER BY j.createdAt DESC LIMIT 5")
    List<JournalEntry> findRecentByUserId(@Param("userId") UUID userId);

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
