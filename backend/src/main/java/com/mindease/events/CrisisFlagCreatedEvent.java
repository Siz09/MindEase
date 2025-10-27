package com.mindease.events;

import com.mindease.model.CrisisFlag;

public class CrisisFlagCreatedEvent {
    private final CrisisFlag flag;

    public CrisisFlagCreatedEvent(CrisisFlag flag) {
        this.flag = flag;
    }

    public CrisisFlag getFlag() {
        return flag;
    }
}

