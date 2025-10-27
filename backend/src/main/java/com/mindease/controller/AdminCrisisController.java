package com.mindease.controller;

import com.mindease.events.CrisisFlagCreatedEvent;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.CrisisFlagRepository;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/admin/crisis-flags")
public class AdminCrisisController {

    private final CrisisFlagRepository repo;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public AdminCrisisController(CrisisFlagRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<CrisisFlag> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        int pageSize = Math.max(1, Math.min(size, 200));
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (from != null && to != null) {
            return repo.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to, pageable);
        }
        return repo.findAllByOrderByCreatedAtDesc(pageable);
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout; client controls
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("open").data("ok"));
        } catch (IOException ignored) {}
        return emitter;
    }

    @EventListener
    public void onNewFlag(CrisisFlagCreatedEvent evt) {
        CrisisFlag flag = evt.getFlag();
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("flag").data(flag));
            } catch (IOException e) {
                emitter.complete();
            }
        });
        emitters.removeIf(SseEmitter::isDisposed);
    }
}

