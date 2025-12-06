package com.mindease.mood.service;

import com.mindease.auth.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MoodPredictionService {

    @Autowired
    private MoodService moodService;

    public Map<String, Object> predictMood(User user) {
        return moodService.predictMood(user);
    }
}

