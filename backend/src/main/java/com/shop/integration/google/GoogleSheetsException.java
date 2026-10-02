package com.shop.integration.google;

/** Controlled diagnostic; never attach remote bodies or credential details. */
public class GoogleSheetsException extends RuntimeException {
    public GoogleSheetsException(String code) { super(code); }
}
