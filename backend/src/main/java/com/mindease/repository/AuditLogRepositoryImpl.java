package com.mindease.repository;

import com.mindease.model.AuditLog;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class AuditLogRepositoryImpl implements AuditLogRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Slice<AuditLog> findByFilters(UUID userId,
                                         String actionType,
                                         OffsetDateTime from,
                                         OffsetDateTime to,
                                         Pageable pageable) {

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<AuditLog> cq = cb.createQuery(AuditLog.class);
        Root<AuditLog> root = cq.from(AuditLog.class);

        List<Predicate> predicates = new ArrayList<>();

        if (userId != null) {
            predicates.add(cb.equal(root.get("userId"), userId));
        }
        if (actionType != null && !actionType.isBlank()) {
            predicates.add(cb.equal(root.get("actionType"), actionType));
        }
        if (from != null && to != null) {
            predicates.add(cb.between(root.get("createdAt"), from, to));
        } else if (from != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
        } else if (to != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
        }

        cq.select(root)
          .where(predicates.toArray(Predicate[]::new))
          .orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));

        TypedQuery<AuditLog> query = em.createQuery(cq);

        int pageSize = pageable.getPageSize();
        int firstResult = Math.toIntExact((long) pageable.getPageNumber() * pageSize);

        query.setFirstResult(firstResult);
        query.setMaxResults(pageSize + 1);

        List<AuditLog> rows = query.getResultList();
        boolean hasNext = rows.size() > pageSize;

        if (hasNext) {
            rows = rows.subList(0, pageSize);
        }

        return new SliceImpl<>(rows, pageable, hasNext);
    }
}

