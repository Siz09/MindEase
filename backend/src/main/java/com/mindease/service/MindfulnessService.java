package com.mindease.service;

import com.mindease.model.MindfulnessSession;
import com.mindease.repository.MindfulnessSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class MindfulnessService {

    @Autowired
    private MindfulnessSessionRepository mindfulnessSessionRepository;

    public List<MindfulnessSession> getAllSessions() {
        return mindfulnessSessionRepository.findAllByOrderByDurationAsc();
    }

    public List<MindfulnessSession> getSessionsByType(String type) {
        return mindfulnessSessionRepository.findByTypeOrderByDurationAsc(type);
    }

    public List<MindfulnessSession> getSessionsByCategory(String category) {
        return mindfulnessSessionRepository.findByCategoryOrderByDurationAsc(category);
    }

    public List<MindfulnessSession> getSessionsByDifficulty(String difficultyLevel) {
        return mindfulnessSessionRepository.findByDifficultyLevelOrderByDurationAsc(difficultyLevel);
    }

    public Optional<MindfulnessSession> getSessionById(UUID id) {
        return mindfulnessSessionRepository.findById(id);
    }

    public List<String> getAllCategories() {
        return mindfulnessSessionRepository.findDistinctCategories();
    }

    public List<MindfulnessSession> getQuickSessions(int maxDuration) {
        return mindfulnessSessionRepository.findAllByOrderByDurationAsc()
                .stream()
                .filter(session -> session.getDuration() <= maxDuration)
                .toList();
    }
}