package com.mindease.controller;

import com.mindease.dto.ContentItemDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/content")
@Tag(name = "Admin Content")
public class AdminContentController {

    private final Map<UUID, ContentItemDto> store = new ConcurrentHashMap<>();

    public AdminContentController() {
        // Seed with a few sample items so the UI has something to display.
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        putSample(new ContentItemDto(
                UUID.randomUUID(),
                "Guided Breathing Exercise",
                "A simple 5-minute guided breathing exercise to reduce stress.",
                "meditation",
                "exercise",
                null,
                4.8,
                124,
                now.minusDays(10)
        ));
        putSample(new ContentItemDto(
                UUID.randomUUID(),
                "Understanding Anxiety",
                "Educational article explaining common anxiety symptoms and coping strategies.",
                "anxiety",
                "article",
                null,
                4.6,
                89,
                now.minusDays(5)
        ));
    }

    private void putSample(ContentItemDto dto) {
        store.put(dto.id(), dto);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List content", description = "List content items with simple filtering")
    public List<ContentItemDto> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        return store.values().stream()
                .filter(item -> type == null || type.isBlank() || type.equalsIgnoreCase(item.type()))
                .filter(item -> category == null || category.isBlank()
                        || category.equalsIgnoreCase(item.category()))
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return (item.title() != null && item.title().toLowerCase().contains(q))
                            || (item.description() != null && item.description().toLowerCase().contains(q));
                })
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get content", description = "Fetch a single content item")
    public ResponseEntity<ContentItemDto> get(@PathVariable UUID id) {
        ContentItemDto item = store.get(id);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(item);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create content", description = "Create a new content item")
    public ResponseEntity<ContentItemDto> create(@RequestBody Map<String, Object> body) {
        UUID id = UUID.randomUUID();
        ContentItemDto dto = fromBody(id, body, OffsetDateTime.now(ZoneOffset.UTC));
        store.put(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update content", description = "Update an existing content item")
    public ResponseEntity<ContentItemDto> update(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body
    ) {
        ContentItemDto existing = store.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        ContentItemDto dto = fromBody(id, body, existing.createdAt());
        store.put(id, dto);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete content", description = "Delete a content item")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        store.remove(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List content categories", description = "Return distinct content categories")
    public List<String> categories() {
        return new ArrayList<>(store.values().stream()
                .map(ContentItemDto::category)
                .filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toCollection(java.util.TreeSet::new)));
    }

    private static ContentItemDto fromBody(UUID id, Map<String, Object> body, OffsetDateTime createdAt) {
        String title = asString(body.get("title"));
        String description = asString(body.get("description"));
        String category = asString(body.get("category"));
        String type = asString(body.get("type"));
        String imageUrl = asString(body.get("imageUrl"));
        Double rating = asDouble(body.get("rating"));
        Integer reviewCount = asInteger(body.get("reviewCount"));
        return new ContentItemDto(
                id,
                title,
                description,
                category,
                type,
                imageUrl,
                rating,
                reviewCount,
                createdAt
        );
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

