package com.shop;

import com.shop.exception.BusinessException;
import com.shop.integration.storage.SupabaseMediaClient;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SupabaseMediaClientTest {
    private final String key = "products/12345678-1234-1234-1234-123456789abc.png";

    @Test void postsToConfiguredBucketWithPrivateCredentialsAndBoundedTimeout() throws Exception {
        var http = mock(HttpClient.class);
        HttpResponse<Object> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(201);
        doReturn(response).when(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        var client = new SupabaseMediaClient("https://project.supabase.co/", "catalog", "private-key", http);
        assertThat(client.upload(key, new byte[]{1, 2, 3}, "image/png"))
                .isEqualTo("https://project.supabase.co/storage/v1/object/public/catalog/" + key);
        var request = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).send(request.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(request.getValue().uri().toString()).isEqualTo("https://project.supabase.co/storage/v1/object/catalog/" + key);
        assertThat(request.getValue().method()).isEqualTo("POST");
        assertThat(request.getValue().headers().firstValue("Authorization")).contains("Bearer private-key");
        assertThat(request.getValue().headers().firstValue("Content-Type")).contains("image/png");
        assertThat(request.getValue().bodyPublisher().orElseThrow().contentLength()).isEqualTo(3);
        assertThat(request.getValue().timeout()).contains(java.time.Duration.ofSeconds(15));
    }

    @Test void rejectsMissingConfigurationWithoutNetworkOrFabricatedUrl() {
        var http = mock(HttpClient.class);
        var client = new SupabaseMediaClient("", "", "", http);
        assertThatThrownBy(() -> client.upload(key, new byte[]{1}, "image/png")).isInstanceOf(BusinessException.class)
                .hasMessage("Media storage is unavailable");
        verifyNoInteractions(http);
    }

    @Test void sanitizesHttpAndConnectionFailures() throws Exception {
        var http = mock(HttpClient.class);
        HttpResponse<Object> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(503);
        doReturn(response).when(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        var client = new SupabaseMediaClient("https://project.supabase.co", "catalog", "private-key", http);
        assertThatThrownBy(() -> client.upload(key, new byte[]{1}, "image/png")).hasMessage("Media storage is unavailable");
        doThrow(new IOException("private-upstream-detail")).when(http).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
        assertThatThrownBy(() -> client.upload(key, new byte[]{1}, "image/png")).hasMessage("Media storage is unavailable");
    }
}
