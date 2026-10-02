package com.shop.integration.google;

@FunctionalInterface
public interface GoogleSheetClient {
    void writeOrder(long row, GoogleSheetRow snapshot) throws Exception;
}
