package com.mindease.mood.service;

import com.mindease.auth.model.User;
import com.mindease.chat.model.ChatSession;
import com.mindease.mood.dto.UnifiedMoodRecord;
import com.mindease.mood.model.MoodCheckIn;
import com.mindease.mood.model.MoodEntry;
import com.mindease.mood.repository.MoodCheckInRepository;
import com.mindease.mood.repository.MoodEntryRepository;
import com.mindease.shared.config.MoodConfig;
import com.mindease.shared.service.PythonAnalyticsServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MoodService {

    private static final Logger log = LoggerFactory.getLogger(MoodService.class);
    private static final double SECONDS_PER_DAY = 86400.0;

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    @Autowired
    private MoodCheckInRepository moodCheckInRepository;

    @Autowired
    private MoodConfig moodConfig;

    @Autowired(required = false)
    private PythonAnalyticsServiceClient pythonAnalyticsServiceClient;

    // ---- MoodEntry operations (from OptimizedMoodService + existing controller) ----

    public MoodEntry saveMoodEntry(User user, Integer moodValue, String notes) {
        MoodEntry entry = new MoodEntry(user, moodValue, notes);
        return moodEntryRepository.save(entry);
    }

    public Page<MoodEntry> getMoodHistory(User user, Pageable pageable) {
        return moodEntryRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Cacheable(value = "moodStats", key = "#user.id")
    public Map<String, Object> getMoodStatistics(User user) {
        List<MoodEntry> entries = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
        if (entries.isEmpty()) {
            return Map.of(
                    "average", 0.0,
                    "total", 0,
                    "trend", "stable",
                    "latest", 0);
        }

        double average = entries.stream()
                .mapToInt(MoodEntry::getMoodValue)
                .average()
                .orElse(0.0);

        int latest = entries.get(0).getMoodValue();
        int previous = entries.size() > 1 ? entries.get(1).getMoodValue() : latest;

        String trend = "stable";
        if (latest > previous)
            trend = "up";
        else if (latest < previous)
            trend = "down";

        return Map.of(
                "average", Math.round(average * 10.0) / 10.0,
                "total", entries.size(),
                "trend", trend,
                "latest", latest);
    }

    @Cacheable(value = "moodDistribution", key = "#user.id")
    public Map<Integer, Long> getMoodDistribution(User user) {
        List<MoodEntry> entries = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
        return entries.stream()
                .collect(Collectors.groupingBy(MoodEntry::getMoodValue, Collectors.counting()));
    }

    public boolean hasMoodEntryToday(User user) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        List<MoodEntry> todaysEntries = moodEntryRepository.findByUserAndCreatedAtBetween(user, startOfDay, endOfDay);
        return !todaysEntries.isEmpty();
    }

    // ---- MoodCheckIn operations (from MoodTrackingService) ----

    public MoodCheckIn createCheckIn(User user, Integer score, List<String> tags,
                                     String checkinType, ChatSession session) {
        if (score == null || score < 1 || score > 5) {
            throw new IllegalArgumentException("Mood score must be between 1 and 5");
        }
        if (!isValidCheckinType(checkinType)) {
            throw new IllegalArgumentException("Invalid checkin type: " + checkinType);
        }

        MoodCheckIn checkIn = new MoodCheckIn(user, score, tags, checkinType);
        if (session != null) {
            checkIn.setSession(session);
        }
        MoodCheckIn saved = moodCheckInRepository.save(checkIn);
        log.info("Created mood check-in for user {}: score={}, type={}", user.getId(), score, checkinType);
        return saved;
    }

    public List<MoodCheckIn> getRecentCheckIns(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return moodCheckInRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);
    }

    public Map<String, Double> getMoodTrend(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> rawData = moodCheckInRepository.getMoodTrendByDate(userId, since);
        Map<String, Double> trend = new LinkedHashMap<>();
        for (Object[] row : rawData) {
            String date = row[0].toString();
            Double avgScore = ((Number) row[1]).doubleValue();
            trend.put(date, avgScore);
        }
        return trend;
    }

    public Double getAverageMoodScore(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return moodCheckInRepository.getAverageMoodScore(userId, since);
    }

    public Map<String, Long> getCheckInTypeStats(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Object[]> rawData = moodCheckInRepository.countByCheckinType(userId, since);
        Map<String, Long> stats = new HashMap<>();
        for (Object[] row : rawData) {
            String type = (String) row[0];
            Long count = ((Number) row[1]).longValue();
            stats.put(type, count);
        }
        return stats;
    }

    public Map<String, Long> getMostCommonTags(UUID userId, int days, int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MoodCheckIn> checkIns = moodCheckInRepository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);

        Map<String, Long> tagCounts = checkIns.stream()
                .filter(c -> c.getTags() != null)
                .flatMap(c -> c.getTags().stream())
                .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));

        return tagCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }

    public Map<String, Object> analyzeChatImpact(UUID userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MoodCheckIn> checkIns = moodCheckInRepository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(userId, since);

        Map<UUID, List<MoodCheckIn>> bySession = checkIns.stream()
                .filter(c -> c.getSession() != null)
                .collect(Collectors.groupingBy(c -> c.getSession().getId()));

        int sessionsWithBothCheckins = 0;
        int sessionsImproved = 0;
        double totalImprovement = 0.0;

        for (List<MoodCheckIn> sessionCheckins : bySession.values()) {
            MoodCheckIn preChat = sessionCheckins.stream()
                    .filter(c -> "pre_chat".equals(c.getCheckinType()))
                    .findFirst().orElse(null);

            MoodCheckIn postChat = sessionCheckins.stream()
                    .filter(c -> "post_chat".equals(c.getCheckinType()))
                    .findFirst().orElse(null);

            if (preChat != null && postChat != null) {
                sessionsWithBothCheckins++;
                int improvement = postChat.getScore() - preChat.getScore();
                totalImprovement += improvement;
                if (improvement > 0) {
                    sessionsImproved++;
                }
            }
        }

        Map<String, Object> impact = new HashMap<>();
        impact.put("sessionsWithBothCheckins", sessionsWithBothCheckins);
        impact.put("sessionsImproved", sessionsImproved);
        impact.put("averageImprovement", sessionsWithBothCheckins > 0
                ? totalImprovement / sessionsWithBothCheckins
                : 0.0);
        impact.put("improvementRate", sessionsWithBothCheckins > 0
                ? (double) sessionsImproved / sessionsWithBothCheckins
                : 0.0);
        return impact;
    }

    public MoodCheckIn getLastCheckIn(UUID userId) {
        return moodCheckInRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
    }

    private boolean isValidCheckinType(String type) {
        if (type == null) {
            return false;
        }
        List<String> validTypes = moodConfig.getTracking().getCheckinTypes();
        return validTypes != null && validTypes.contains(type);
    }

    // ---- Unified mood operations (from UnifiedMoodService) ----

    private Integer mapCheckInScoreToTenScale(Integer score) {
        if (score == null) {
            return null;
        }
        return score * 2;
    }

    public List<UnifiedMoodRecord> getUnifiedMoodHistory(User user, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        List<MoodEntry> moodEntries = moodEntryRepository
                .findByUserAndCreatedAtAfterOrderByCreatedAtAsc(user, since);
        List<MoodCheckIn> moodCheckIns = moodCheckInRepository
                .findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(user.getId(), since);

        List<UnifiedMoodRecord> records = new ArrayList<>();

        for (MoodEntry entry : moodEntries) {
            records.add(new UnifiedMoodRecord(
                    entry.getId(),
                    entry.getMoodValue(),
                    "mood_entry",
                    entry.getNotes(),
                    null,
                    entry.getCreatedAt()));
        }

        for (MoodCheckIn checkIn : moodCheckIns) {
            records.add(new UnifiedMoodRecord(
                    checkIn.getId(),
                    mapCheckInScoreToTenScale(checkIn.getScore()),
                    "mood_checkin",
                    null,
                    checkIn.getCheckinType(),
                    checkIn.getCreatedAt()));
        }

        records.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        log.debug("Retrieved {} unified mood records for user {} ({} days)",
                records.size(), user.getId(), days);
        return records;
    }

    public Map<String, Double> getUnifiedMoodTrend(User user, int days) {
        // Use Python analytics service if available
        if (pythonAnalyticsServiceClient != null) {
            try {
                return pythonAnalyticsServiceClient.getMoodTrend(user.getId(), days);
            } catch (Exception e) {
                log.warn("Python analytics service unavailable for mood trend, using Java fallback: {}", e.getMessage());
            }
        }

        // Fallback to Java implementation
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);
        Map<String, Double> trend = records.stream()
                .filter(record -> record.getMoodValue() != null)
                .collect(Collectors.groupingBy(
                        record -> record.getCreatedAt().toLocalDate().toString(),
                        Collectors.averagingInt(UnifiedMoodRecord::getMoodValue)));

        log.debug("Calculated mood trend for user {}: {} days of data", user.getId(), trend.size());
        return trend;
    }

    public Double getAverageUnifiedMood(User user, int days) {
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);
        if (records.isEmpty()) {
            return null;
        }
        return records.stream()
                .filter(record -> record.getMoodValue() != null)
                .mapToInt(UnifiedMoodRecord::getMoodValue)
                .average()
                .orElse(0.0);
    }

    public Map<String, Long> getMoodCountBySource(User user, int days) {
        List<UnifiedMoodRecord> records = getUnifiedMoodHistory(user, days);
        return records.stream()
                .collect(Collectors.groupingBy(UnifiedMoodRecord::getSource, Collectors.counting()));
    }

    public UnifiedMoodRecord getMostRecentMood(User user) {
        List<MoodEntry> recentEntries = moodEntryRepository.findByUserOrderByCreatedAtDesc(user);
        MoodCheckIn recentCheckIn = moodCheckInRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId());

        UnifiedMoodRecord mostRecent = null;
        LocalDateTime mostRecentDate = null;

        if (!recentEntries.isEmpty()) {
            MoodEntry entry = recentEntries.get(0);
            mostRecentDate = entry.getCreatedAt();
            mostRecent = new UnifiedMoodRecord(
                    entry.getId(),
                    entry.getMoodValue(),
                    "mood_entry",
                    entry.getNotes(),
                    null,
                    entry.getCreatedAt());
        }

        if (recentCheckIn != null &&
                (mostRecentDate == null || recentCheckIn.getCreatedAt().isAfter(mostRecentDate))) {
            mostRecent = new UnifiedMoodRecord(
                    recentCheckIn.getId(),
                    mapCheckInScoreToTenScale(recentCheckIn.getScore()),
                    "mood_checkin",
                    null,
                    recentCheckIn.getCheckinType(),
                    recentCheckIn.getCreatedAt());
        }

        return mostRecent;
    }

    // ---- Mood prediction (delegating existing logic) ----

    public Map<String, Object> predictMood(User user) {
        // Use Python analytics service if available
        if (pythonAnalyticsServiceClient != null) {
            try {
                Map<String, Object> pythonResult = pythonAnalyticsServiceClient.predictMood(user.getId(), 14);
                // Map Python response keys to match Java format if needed
                return pythonResult;
            } catch (Exception e) {
                log.warn("Python analytics service unavailable for mood prediction, using Java fallback: {}", e.getMessage());
            }
        }

        // Fallback to Java implementation
        LocalDateTime fourteenDaysAgo = LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(14);
        List<MoodEntry> entries = moodEntryRepository.findByUserAndCreatedAtAfterOrderByCreatedAtAsc(user,
                fourteenDaysAgo);

        Map<String, Object> result = new HashMap<>();
        if (entries.size() < 3) {
            result.put("prediction", null);
            result.put("trend", "insufficient_data");
            String insight = moodConfig.getPrediction().getInsights().getOrDefault(
                    "insufficient-data",
                    "Keep tracking your mood for a few more days to get personalized insights!");
            result.put("insight", insight);
            return result;
        }

        double n = entries.size();
        double sumX = 0;
        double sumY = 0;
        double sumXY = 0;
        double sumX2 = 0;

        long startTime = entries.get(0).getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC);

        for (MoodEntry entry : entries) {
            double x = (entry.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC) - startTime) / SECONDS_PER_DAY;
            double y = entry.getMoodValue();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (Math.abs(denominator) < 1e-10) {
            result.put("prediction", entries.get(entries.size() - 1).getMoodValue());
            result.put("trend", "stable");
            String insight = moodConfig.getPrediction().getInsights().getOrDefault(
                    "stable",
                    "Your mood has been relatively stable recently.");
            result.put("insight", insight);
            return result;
        }

        double slope = (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;

        double lastX = (entries.get(entries.size() - 1).getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC)
                - startTime) / SECONDS_PER_DAY;
        double nextX = lastX + 1.0;
        double predictedValue = slope * nextX + intercept;

        predictedValue = Math.max(1, Math.min(10, predictedValue));

        result.put("prediction", Math.round(predictedValue * 10.0) / 10.0);
        result.put("slope", slope);

        double threshold = moodConfig.getPrediction().getTrendThreshold() != null
                ? moodConfig.getPrediction().getTrendThreshold()
                : 0.1;

        String trend;
        String insight;
        if (slope > threshold) {
            trend = "improving";
            insight = moodConfig.getPrediction().getInsights().getOrDefault(
                    "improving",
                    "Your mood seems to be on an upward trend! Keep doing what you're doing.");
        } else if (slope < -threshold) {
            trend = "declining";
            insight = moodConfig.getPrediction().getInsights().getOrDefault(
                    "declining",
                    "It looks like things have been tough lately. Consider practicing some mindfulness or reaching out to a friend.");
        } else {
            trend = "stable";
            insight = moodConfig.getPrediction().getInsights().getOrDefault(
                    "stable",
                    "Your mood has been relatively stable recently.");
        }

        result.put("trend", trend);
        result.put("insight", insight);
        return result;
    }
}
