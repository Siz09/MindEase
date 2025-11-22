package com.mindease.service;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import com.mindease.repository.MoodEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class MoodPredictionService {

    private static final double SECONDS_PER_DAY = 86400.0;

    @Autowired
    private MoodEntryRepository moodEntryRepository;

    public Map<String, Object> predictMood(User user) {
        // Fetch last 14 days of mood data
        // Use UTC for consistent date boundaries across all users regardless of server timezone
        LocalDateTime fourteenDaysAgo = LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(14);
        List<MoodEntry> entries = moodEntryRepository.findByUserAndCreatedAtAfterOrderByCreatedAtAsc(user,
                fourteenDaysAgo);

        Map<String, Object> result = new HashMap<>();

        if (entries.size() < 3) {
            result.put("prediction", null);
            result.put("trend", "insufficient_data");
            result.put("insight", "Keep tracking your mood for a few more days to get personalized insights!");
            return result;
        }

        // Simple Linear Regression
        // x = days from start, y = mood value
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
            // All entries at same time or insufficient variance
            result.put("prediction", entries.get(entries.size() - 1).getMoodValue());
            result.put("trend", "stable");
            result.put("insight", "Your mood has been relatively stable recently.");
            return result;
        }

        double slope = (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;

        // Predict for tomorrow (last entry time + 1 day)
        double lastX = (entries.get(entries.size() - 1).getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC)
                - startTime) / SECONDS_PER_DAY;
        double nextX = lastX + 1.0;
        double predictedValue = slope * nextX + intercept;

        // Clamp prediction 1-10
        predictedValue = Math.max(1, Math.min(10, predictedValue));

        result.put("prediction", Math.round(predictedValue * 10.0) / 10.0);
        result.put("slope", slope);

        String trend;
        String insight;

        if (slope > 0.1) {
            trend = "improving";
            insight = "Your mood seems to be on an upward trend! Keep doing what you're doing.";
        } else if (slope < -0.1) {
            trend = "declining";
            insight = "It looks like things have been tough lately. Consider practicing some mindfulness or reaching out to a friend.";
        } else {
            trend = "stable";
            insight = "Your mood has been relatively stable recently.";
        }

        result.put("trend", trend);
        result.put("insight", insight);

        return result;
    }
}
