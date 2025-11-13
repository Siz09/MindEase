package com.mindease.repository;

import com.mindease.dto.ActiveUsersPoint;
import com.mindease.dto.AiUsagePoint;
import com.mindease.dto.MoodCorrelationPoint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@Transactional(readOnly = true)
public class AnalyticsRepository {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsRepository.class);

    @PersistenceContext
    private EntityManager em;

    private static void validateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Date range parameters cannot be null");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must be before or equal to 'to'");
        }
    }

    /**
     * Daily active users (distinct users per day) in [from, to].
     */
    public List<ActiveUsersPoint> dailyActiveUsers(OffsetDateTime from, OffsetDateTime to) {
        validateRange(from, to);
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
                .map(r -> new ActiveUsersPoint(toLocalDate(r[0]), ((Number) r[1]).longValue()))
                .toList();
    }

    /**
     * AI usage per day by counting chat send actions from audit logs.
     */
    public List<AiUsagePoint> dailyAiUsage(OffsetDateTime from, OffsetDateTime to) {
        validateRange(from, to);
        var sql = """
            SELECT DATE(a.created_at) AS day, COUNT(*) AS calls
            FROM audit_logs a
            WHERE a.created_at BETWEEN :from AND :to
              AND a.action_type = 'CHAT_SENT'
            GROUP BY day
            ORDER BY day
        """;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();
        return rows.stream()
                .map(r -> new AiUsagePoint(toLocalDate(r[0]), ((Number) r[1]).longValue()))
                .toList();
    }

    /**
     * Mood vs activity correlation over date range.
     * - avg mood per day (from mood_entries.mood_value)
     * - chat count per day (from audit_logs)
     */
    public List<MoodCorrelationPoint> moodCorrelation(OffsetDateTime from, OffsetDateTime to) {
        validateRange(from, to);
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
                  AND a.action_type = 'CHAT_SENT'
                GROUP BY day
            )
            SELECT d.day,
                   m.avg_mood,
                   COALESCE(c.chat_count, 0) AS chat_count
            FROM (
                SELECT generate_series(:from::date, :to::date, INTERVAL '1 day')::date AS day
            ) d
            LEFT JOIN moods m ON m.day = d.day
            LEFT JOIN chats c ON c.day = d.day
            ORDER BY d.day
        """;
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> rows = em.createNativeQuery(sql)
                    .setParameter("from", from)
                    .setParameter("to", to)
                    .getResultList();
            return rows.stream()
                    .map(r -> new MoodCorrelationPoint(
                            toLocalDate(r[0]),
                            r[1] == null ? null : ((Number) r[1]).doubleValue(),
                            ((Number) r[2]).longValue()))
                    .toList();
        } catch (jakarta.persistence.PersistenceException ex) {
            // Only fallback for dialect/SQL issues related to generate_series (e.g., H2/other DBs)
            if (isGenerateSeriesUnsupported(ex)) {
                log.warn("Database does not support generate_series; using Java fallback for moodCorrelation");
                return moodCorrelationFallback(from, to);
            }
            // Re-throw for other persistence errors (connection, timeouts, etc.)
            throw ex;
        }
    }

    private static boolean isGenerateSeriesUnsupported(Throwable ex) {
        while (ex != null) {
            String msg = ex.getMessage();
            if (msg != null) {
                String m = msg.toLowerCase();
                if (m.contains("generate_series") || m.contains("function generate_series") || m.contains("unknown function: generate_series")) {
                    return true;
                }
            }
            ex = ex.getCause();
        }
        return false;
    }

    /**
     * Fallback implementation that avoids generate_series for non-Postgres databases.
     * Queries aggregated moods and chats, then stitches missing days in Java.
     */
    private List<MoodCorrelationPoint> moodCorrelationFallback(OffsetDateTime from, OffsetDateTime to) {
        // Aggregate moods per day
        var moodsSql = """
            SELECT DATE(m.created_at) AS day, AVG(m.mood_value)
            FROM mood_entries m
            WHERE m.created_at BETWEEN :from AND :to
            GROUP BY DATE(m.created_at)
            ORDER BY DATE(m.created_at)
        """;

        // Aggregate chat counts per day
        var chatsSql = """
            SELECT DATE(a.created_at) AS day, COUNT(*)
            FROM audit_logs a
            WHERE a.created_at BETWEEN :from AND :to
              AND a.action_type = 'CHAT_SENT'
            GROUP BY DATE(a.created_at)
            ORDER BY DATE(a.created_at)
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> moodRows = em.createNativeQuery(moodsSql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        @SuppressWarnings("unchecked")
        List<Object[]> chatRows = em.createNativeQuery(chatsSql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        Map<LocalDate, Double> avgMoodByDay = new HashMap<>();
        for (Object[] r : moodRows) {
            LocalDate day = toLocalDate(r[0]);
            Double avg = r[1] == null ? null : ((Number) r[1]).doubleValue();
            avgMoodByDay.put(day, avg);
        }

        Map<LocalDate, Long> chatCountByDay = new HashMap<>();
        for (Object[] r : chatRows) {
            LocalDate day = toLocalDate(r[0]);
            Long count = r[1] == null ? 0L : ((Number) r[1]).longValue();
            chatCountByDay.put(day, count);
        }

        // Align date extraction with DB DATE() behavior by using the offsets in the provided timestamps
        LocalDate start = from.toLocalDate();
        LocalDate end = to.toLocalDate();

        java.util.ArrayList<MoodCorrelationPoint> result = new java.util.ArrayList<>();
        LocalDate d = start;
        while (!d.isAfter(end)) {
            Double avgMood = avgMoodByDay.getOrDefault(d, null);
            long chatCount = chatCountByDay.getOrDefault(d, 0L);
            result.add(new MoodCorrelationPoint(d, avgMood, chatCount));
            d = d.plusDays(1);
        }
        return result;
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        if (value instanceof java.time.LocalDate ld) {
            return ld;
        }
        if (value instanceof java.sql.Timestamp ts) {
            return ts.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        if (value instanceof java.util.Date ud) {
            return ud.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
        }
        // Fallback: try string parse
        return LocalDate.parse(value.toString());
    }
}
