package com.mindease.safety;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Primary
public class NoopRiskScorer implements RiskScorer {
    @Override
    public Optional<Double> score(String text) {
        return Optional.empty(); // placeholder (can swap with real model bean later)
    }
}

