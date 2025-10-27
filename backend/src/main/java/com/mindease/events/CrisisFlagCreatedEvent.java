package com.mindease.events;

import com.mindease.model.CrisisFlag;
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
