package com.mindease.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(
            @Value("${spring.cache.type:}") String cacheType,
            @Value("${spring.cache.caffeine.spec:expireAfterWrite=5m,maximumSize=5000}") String caffeineSpec) {
        String[] cacheNames = new String[] {
                "moodStats",
                "moodDistribution",
                "chatSession",
                "recentMessages",
                "subscription_status"
        };

        if ("caffeine".equalsIgnoreCase(cacheType)) {
            CaffeineCacheManager cacheManager = new CaffeineCacheManager(cacheNames);
            cacheManager.setAllowNullValues(false);
            cacheManager.setCacheSpecification(caffeineSpec);
            return cacheManager;
        }

        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(cacheNames);
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}
