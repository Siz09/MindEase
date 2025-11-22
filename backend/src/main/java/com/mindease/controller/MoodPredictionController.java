package com.mindease.controller;

import com.mindease.model.User;
import com.mindease.service.MoodPredictionService;
import com.mindease.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/mood/prediction")
@Tag(name = "Mood Prediction", description = "AI-powered mood analysis and prediction")
public class MoodPredictionController {

    @Autowired
    private MoodPredictionService moodPredictionService;

    @Autowired
    private UserService userService;

    @GetMapping
    @Operation(summary = "Get mood prediction", description = "Analyze recent mood history to predict future mood and provide insights")
    public ResponseEntity<?> getPrediction(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));

        Map<String, Object> prediction = moodPredictionService.predictMood(user);
        return ResponseEntity.ok(prediction);
    }
}
