package com.shop.config;

import org.springframework.beans.factory.BeanInitializationException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@Profile("!local & !test")
public class DatabaseSecretConfig {

    @Bean
    static BeanFactoryPostProcessor requireDatabasePassword(Environment environment) {
        return beanFactory -> {
            String password = environment.getProperty("spring.datasource.password");
            if (!StringUtils.hasText(password) || password.contains("${DATABASE_PASSWORD}")) {
                throw new BeanInitializationException(
                        "DATABASE_PASSWORD is required outside local/test profiles");
            }
        };
    }
}
