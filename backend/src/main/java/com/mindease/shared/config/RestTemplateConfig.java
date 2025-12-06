package com.mindease.shared.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    private static final Logger log = LoggerFactory.getLogger(RestTemplateConfig.class);

    @Value("${mindease.ai.providers.local.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${mindease.ai.providers.local.read-timeout:60000}")
    private int readTimeout;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        log.info("RestTemplate configured with connectTimeout={}ms, readTimeout={}ms", connectTimeout, readTimeout);

        return new RestTemplate(factory);
    }
}
