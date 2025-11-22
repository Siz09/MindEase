package com.mindease.repository;

import com.mindease.model.MoodCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodCheckInRepository extends JpaRepository<MoodCheckIn, UUID> {

    /**
     * Find mood check-ins for a user within a date range, ordered by most recent first.
     */
    List<MoodCheckIn> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);

    /**
     * Find mood check-ins for a specific session.
     */
    List<MoodCheckIn> findBySessionIdOrderByCreatedAt(UUID sessionId);

    /**
     * Get mood trend data for a user over a period (grouped by date).
     */
    @Query("SELECT DATE(mc.createdAt) as checkDate, AVG(mc.score) as avgScore, COUNT(mc) as count " +
           "FROM MoodCheckIn mc WHERE mc.user.id = :userId AND mc.createdAt > :since " +
           "GROUP BY DATE(mc.createdAt) ORDER BY DATE(mc.createdAt)")
    List<Object[]> getMoodTrendByDate(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Get average mood score for a user over a period.
     */
    @Query("SELECT AVG(mc.score) FROM MoodCheckIn mc WHERE mc.user.id = :userId AND mc.createdAt > :since")
    Double getAverageMoodScore(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Count check-ins by type for a user.
     */
    @Query("SELECT mc.checkinType, COUNT(mc) FROM MoodCheckIn mc WHERE mc.user.id = :userId " +
           "AND mc.createdAt > :since GROUP BY mc.checkinType")
    List<Object[]> countByCheckinType(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Find most recent check-in for a user.
     */
    MoodCheckIn findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}

