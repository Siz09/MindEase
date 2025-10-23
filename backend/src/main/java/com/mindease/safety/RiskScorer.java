package com.mindease.safety;

import java.util.Optional;

public interface RiskScorer {
    /**
     * Returns Optional score in [0,1]. Empty = scorer disabled/not available.
     */
    Optional<Double> score(String text);
}

