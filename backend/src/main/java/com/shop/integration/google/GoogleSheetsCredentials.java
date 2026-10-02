package com.shop.integration.google;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GoogleSheetsCredentials {
    private final String path;
    private GoogleCredentials credentials;
    public GoogleSheetsCredentials(@Value("${app.sheets.credentials-path:}") String path) { this.path=path; }

    public synchronized String accessToken() {
        try {
            if(path.isBlank()) throw new GoogleSheetsException("SHEETS_CREDENTIALS");
            if(credentials==null) {
                try(var stream=Files.newInputStream(Path.of(path))) {
                    // Explicit credential type; only trusted server-mounted service-account JSON is accepted.
                    credentials=ServiceAccountCredentials.fromStream(stream)
                        .createWithCustomRetryStrategy(false)
                        .createScoped(List.of("https://www.googleapis.com/auth/spreadsheets"));
                }
            }
            credentials.refreshIfExpired();
            return credentials.getAccessToken().getTokenValue();
        } catch(Exception failure) {throw new GoogleSheetsException("SHEETS_CREDENTIALS");}
    }
}
