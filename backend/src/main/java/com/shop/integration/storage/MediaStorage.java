package com.shop.integration.storage;

/** Stores an already validated image; returns its configured public HTTPS URL. */
public interface MediaStorage {
    String upload(String objectKey, byte[] bytes, String contentType);
}
