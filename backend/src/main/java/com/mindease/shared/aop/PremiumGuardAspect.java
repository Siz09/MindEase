package com.mindease.shared.aop;

import com.mindease.shared.exception.PremiumRequiredException;
import com.mindease.shared.security.RequiresPremium;
import com.mindease.shared.security.CurrentUserId;
import com.mindease.subscription.service.PremiumAccessService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
public class PremiumGuardAspect {

    private static final Logger log = LoggerFactory.getLogger(PremiumGuardAspect.class);

    private final PremiumAccessService premiumAccessService;

    public PremiumGuardAspect(PremiumAccessService premiumAccessService) {
        this.premiumAccessService = premiumAccessService;
    }

    @Around("@within(com.mindease.shared.security.RequiresPremium) || @annotation(com.mindease.shared.security.RequiresPremium)")
    public Object requirePremium(ProceedingJoinPoint pjp) throws Throwable {
        UUID userId = CurrentUserId.get();
        if (userId == null) {
            log.warn("Premium gate blocked: no authenticated user");
            throw new PremiumRequiredException();
        }
        boolean ok = premiumAccessService.isPremium(userId);
        if (!ok) {
            log.info("Premium gate blocked: userId={}", userId);
            throw new PremiumRequiredException();
        }
        return pjp.proceed();
    }
}
