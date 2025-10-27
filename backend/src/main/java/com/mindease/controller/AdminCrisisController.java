package com.mindease.controller;

import com.mindease.events.CrisisFlagCreatedEvent;
import com.mindease.model.CrisisFlag;
import com.mindease.repository.CrisisFlagRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@RestController
@RequestMapping("/api/admin/crisis-flags")
public class AdminCrisisController {

    private final CrisisFlagRepository repo;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private static final int MAX_SSE_CONNECTIONS = 100;

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
        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must be before or equal to to");
        }
        if (from == null && to == null) {
            return repo.findAllByOrderByCreatedAtDesc(pageable);
        }
        OffsetDateTime f = (from != null) ? from : OffsetDateTime.of(1970, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime t = (to != null) ? to : OffsetDateTime.now(ZoneOffset.UTC);
        return repo.findByCreatedAtBetweenOrderByCreatedAtDesc(f, t, pageable);
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter stream() {
        if (emitters.size() >= MAX_SSE_CONNECTIONS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Maximum SSE connections reached");
        }
        SseEmitter emitter = new SseEmitter(0L); // no timeout; client controls
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event().name("open").data("ok"));
            emitters.add(emitter);
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNewFlag(CrisisFlagCreatedEvent evt) {
        CrisisFlag flag = evt.getFlag();
        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("flag").data(flag));
            } catch (IOException e) {
                emitter.complete();
            }
        });
    }
}
