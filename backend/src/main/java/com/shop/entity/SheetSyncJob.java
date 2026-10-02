package com.shop.entity;

import java.time.Instant;

/** Immutable lease claim. A unique token identifies each attempt, including reclamation. */
public record SheetSyncJob(long id, long orderId, int retryCount, Instant lockedAt, String lockedBy) {}
