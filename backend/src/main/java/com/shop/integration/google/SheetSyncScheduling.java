package com.shop.integration.google;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods=false)
@EnableScheduling
@ConditionalOnProperty(name="app.sheets.enabled",havingValue="true")
public class SheetSyncScheduling {
    private final SheetSyncWorker worker;
    public SheetSyncScheduling(SheetSyncWorker worker) {this.worker=worker;}
    @Scheduled(fixedDelayString="${app.sheets.poll-delay-ms:5000}")
    public void poll() {worker.runOnce();}
}
