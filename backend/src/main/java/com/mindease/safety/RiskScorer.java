package com.mindease.safety;

import java.util.Optional;

public interface RiskScorer {
    /**
     * Scores the provided text for risk assessment.
     *
     * @param text the text content to analyze for risk (must not be null)
     * @return a score between 0.0 (low risk) and 1.0 (high risk) wrapped in Optional,
     *         or empty Optional if the scorer is disabled or unavailable
     * @throws NullPointerException if text is null
     */
    Optional<Double> score(String text);
}
