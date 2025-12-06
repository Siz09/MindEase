package com.mindease.shared.events;

import com.mindease.crisis.model.CrisisFlag;
import java.util.Objects;

public class CrisisFlagCreatedEvent {
    private final CrisisFlag flag;

    public CrisisFlagCreatedEvent(CrisisFlag flag) {
        this.flag = Objects.requireNonNull(flag, "CrisisFlag cannot be null");
    }

    public CrisisFlag getFlag() {
        return flag;
    }
}
