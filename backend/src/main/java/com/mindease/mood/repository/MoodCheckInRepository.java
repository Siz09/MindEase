package com.mindease.mood.repository;

import com.mindease.mood.model.MoodCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodCheckInRepository extends JpaRepository<MoodCheckIn, UUID> {

    List<MoodCheckIn> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(UUID userId, LocalDateTime after);

    List<MoodCheckIn> findBySessionIdOrderByCreatedAt(UUID sessionId);

    @Query("SELECT DATE(mc.createdAt) as checkDate, AVG(mc.score) as avgScore, COUNT(mc) as count " +
           "FROM MoodCheckIn mc WHERE mc.user.id = :userId AND mc.createdAt > :since " +
           "GROUP BY DATE(mc.createdAt) ORDER BY DATE(mc.createdAt)")
    List<Object[]> getMoodTrendByDate(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    @Query("SELECT AVG(mc.score) FROM MoodCheckIn mc WHERE mc.user.id = :userId AND mc.createdAt > :since")
    Double getAverageMoodScore(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    @Query("SELECT mc.checkinType, COUNT(mc) FROM MoodCheckIn mc WHERE mc.user.id = :userId " +
           "AND mc.createdAt > :since GROUP BY mc.checkinType")
    List<Object[]> countByCheckinType(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    MoodCheckIn findFirstByUserIdOrderByCreatedAtDesc(UUID userId);
}

