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

import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.mindease.model.Content;
import com.mindease.repository.ContentRepository;
import org.springframework.data.domain.Sort;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/content")
@Tag(name = "Admin Content")
public class AdminContentController {

    private final ContentRepository contentRepository;

    public AdminContentController(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List content", description = "List content items with simple filtering")
    public List<ContentItemDto> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        List<Content> all = contentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return all.stream()
                .filter(item -> type == null || type.isBlank()
                        || (item.getType() != null && type.equalsIgnoreCase(item.getType())))
                .filter(item -> category == null || category.isBlank()
                        || (item.getCategory() != null && category.equalsIgnoreCase(item.getCategory())))
                .filter(item -> {
                    if (search == null || search.isBlank())
                        return true;
                    String q = search.toLowerCase();
                    return (item.getTitle() != null && item.getTitle().toLowerCase().contains(q))
                            || (item.getDescription() != null && item.getDescription().toLowerCase().contains(q));
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get content", description = "Fetch a single content item")
    public ResponseEntity<ContentItemDto> get(@PathVariable UUID id) {
        return contentRepository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create content", description = "Create a new content item")
    public ResponseEntity<ContentItemDto> create(@RequestBody Map<String, Object> body) {
        Content content = new Content();
        updateContentFromMap(content, body);
        content = contentRepository.save(content);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(content));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update content", description = "Update an existing content item")
    public ResponseEntity<ContentItemDto> update(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        return contentRepository.findById(id)
                .map(content -> {
                    updateContentFromMap(content, body);
                    return contentRepository.save(content);
                })
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete content", description = "Delete a content item")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!contentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List content categories", description = "Return distinct content categories")
    public List<String> categories() {
        return contentRepository.findDistinctCategories();
    }

    private ContentItemDto toDto(Content content) {
        return new ContentItemDto(
                content.getId(),
                content.getTitle(),
                content.getDescription(),
                content.getCategory(),
                content.getType(),
                content.getImageUrl(),
                content.getRating(),
                content.getReviewCount(),
                content.getCreatedAt());
    }

    private void updateContentFromMap(Content content, Map<String, Object> body) {
        if (body.containsKey("title"))
            content.setTitle(asString(body.get("title")));
        if (body.containsKey("description"))
            content.setDescription(asString(body.get("description")));
        if (body.containsKey("body"))
            content.setBody(asString(body.get("body")));
        if (body.containsKey("category"))
            content.setCategory(asString(body.get("category")));
        if (body.containsKey("type"))
            content.setType(asString(body.get("type")));
        if (body.containsKey("imageUrl"))
            content.setImageUrl(asString(body.get("imageUrl")));
        if (body.containsKey("rating"))
            content.setRating(asDouble(body.get("rating")));
        if (body.containsKey("reviewCount"))
            content.setReviewCount(asInteger(body.get("reviewCount")));
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static Double asDouble(Object value) {
        if (value == null)
            return null;
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
        if (value == null)
            return null;
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
