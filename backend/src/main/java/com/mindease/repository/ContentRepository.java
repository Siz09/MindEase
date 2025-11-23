package com.mindease.repository;

import com.mindease.model.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContentRepository extends JpaRepository<Content, UUID> {
    List<Content> findByType(String type);

    List<Content> findByCategory(String category);

    @Query("SELECT DISTINCT c.category FROM Content c WHERE c.category IS NOT NULL")
    List<String> findDistinctCategories();
}
