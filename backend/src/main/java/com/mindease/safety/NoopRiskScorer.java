package com.mindease.safety;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile({"dev", "test"})
public class NoopRiskScorer implements RiskScorer {
    @Override
    public Optional<Double> score(String text) {
        if (text == null) throw new NullPointerException("text must not be null");
        return Optional.empty(); // placeholder (can swap with real model bean later)
    }
}
