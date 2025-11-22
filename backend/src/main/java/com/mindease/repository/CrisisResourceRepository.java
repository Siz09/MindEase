package com.mindease.repository;

import com.mindease.model.CrisisResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrisisResourceRepository extends JpaRepository<CrisisResource, UUID> {

    /**
     * Find active crisis resources for a specific language and region, ordered by display_order.
     */
    List<CrisisResource> findByLanguageAndRegionAndActiveTrueOrderByDisplayOrder(String language, String region);

    /**
     * Find active crisis resources for a language (any region or global), ordered by display_order.
     */
    @Query("SELECT cr FROM CrisisResource cr WHERE cr.language = :language AND cr.active = true " +
           "AND (cr.region = :region OR cr.region = 'global') ORDER BY cr.displayOrder")
    List<CrisisResource> findByLanguageAndRegionOrGlobal(@Param("language") String language,
                                                          @Param("region") String region);

    /**
     * Find all active crisis resources for a language, ordered by display_order.
     */
    List<CrisisResource> findByLanguageAndActiveTrueOrderByDisplayOrder(String language);

    /**
     * Find all crisis resources for admin management.
     */
    List<CrisisResource> findAllByOrderByLanguageAscDisplayOrderAsc();
}
