package com.mindease.repository;

import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.AiUsagePoint;
import com.mindease.dto.MoodCorrelationPoint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
@Transactional(readOnly = true)
public class AnalyticsRepository {

    @PersistenceContext
    private EntityManager em;

    /**
     * Daily active users (distinct users per day) in [from, to].
     */
    public List<ActiveUsersPoint> dailyActiveUsers(OffsetDateTime from, OffsetDateTime to) {
        var sql = """
            SELECT DATE(a.created_at) AS day, COUNT(DISTINCT a.user_id) AS active_users
            FROM audit_logs a
            WHERE a.created_at BETWEEN :from AND :to
            GROUP BY day
            ORDER BY day
        """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
        return rows.stream()
                .map(r -> new ActiveUsersPoint(((java.sql.Date) r[0]).toLocalDate(), ((Number) r[1]).longValue()))
                .toList();
    }

    /**
     * AI usage per day by counting chat send actions from audit logs.
     */
    public List<AiUsagePoint> dailyAiUsage(OffsetDateTime from, OffsetDateTime to) {
        var sql = """
            SELECT DATE(a.created_at) AS day, COUNT(*) AS calls
            FROM audit_logs a
            WHERE a.created_at BETWEEN :from AND :to
              AND a.action_type IN ('CHAT_SENT')
            GROUP BY day
            ORDER BY day
        """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
        return rows.stream()
                .map(r -> new AiUsagePoint(((java.sql.Date) r[0]).toLocalDate(), ((Number) r[1]).longValue()))
                .toList();
    }

    /**
     * Mood vs activity correlation over date range.
     * - avg mood per day (from mood_entries.mood_value)
     * - chat count per day (from audit_logs)
     */
    public List<MoodCorrelationPoint> moodCorrelation(OffsetDateTime from, OffsetDateTime to) {
        var sql = """
            WITH moods AS (
                SELECT DATE(m.created_at) AS day, AVG(m.mood_value)::float8 AS avg_mood
                FROM mood_entries m
                WHERE m.created_at BETWEEN :from AND :to
                GROUP BY day
            ),
            chats AS (
                SELECT DATE(a.created_at) AS day, COUNT(*) AS chat_count
                FROM audit_logs a
                WHERE a.created_at BETWEEN :from AND :to
                  AND a.action_type IN ('CHAT_SENT')
                GROUP BY day
            )
            SELECT d.day,
                   COALESCE(m.avg_mood, NULL) AS avg_mood,
                   COALESCE(c.chat_count, 0) AS chat_count
            FROM (
                SELECT generate_series(DATE(:from), DATE(:to), '1 day') AS day
            ) d
            LEFT JOIN moods m ON m.day = d.day
            LEFT JOIN chats c ON c.day = d.day
            ORDER BY d.day
        """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
        return rows.stream()
                .map(r -> new MoodCorrelationPoint(
                        ((java.sql.Date) r[0]).toLocalDate(),
                        r[1] == null ? null : ((Number) r[1]).doubleValue(),
                        ((Number) r[2]).longValue()))
                .toList();
    }
}

