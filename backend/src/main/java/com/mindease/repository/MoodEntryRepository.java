package com.mindease.repository;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodEntryRepository extends JpaRepository<MoodEntry, UUID> {
    List<MoodEntry> findByUserOrderByCreatedAtDesc(User user);

    Page<MoodEntry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<MoodEntry> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(User user, LocalDateTime start,
            LocalDateTime end);

    List<MoodEntry> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    // Optimized queries for better performance
    @Query("SELECT COUNT(m) FROM MoodEntry m WHERE m.user = :user AND m.createdAt >= :startDate")
    long countByUserAndCreatedAtAfter(@Param("user") User user, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT AVG(m.moodValue) FROM MoodEntry m WHERE m.user = :user AND m.createdAt >= :startDate")
    Double getAverageMoodByUserAndCreatedAtAfter(@Param("user") User user, @Param("startDate") LocalDateTime startDate);

    /**
     * Bulk delete for memory-efficient cleanup operations.
     *
     * WARNING: This derived delete query operates directly at the database level,
     * bypassing JPA entity lifecycle callbacks and configured cascade operations.
     *
     * Caller must ensure no foreign key constraint violations occur.
     * Related entities should be deleted before calling this method.
     */
    @Transactional
    @Modifying
    void deleteByUser(User user);

    List<MoodEntry> findByUserAndCreatedAtAfterOrderByCreatedAtAsc(User user, LocalDateTime date);
}
