package com.shop;

import com.shop.integration.storage.R2MediaClient;
import com.shop.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class R2MediaClientTest {
    final String key = "products/12345678-1234-1234-1234-123456789abc.png";
    @Test void uploadsValidatedKeyAndReturnsPublicUrlWithoutCredentials() throws Exception {
        var s3 = mock(S3Client.class);
        var client = new R2MediaClient("catalog", "https://media.example.test/", s3);
        assertThat(client.upload(key, new byte[]{1,2,3}, "image/png")).isEqualTo("https://media.example.test/" + key);
        var request = ArgumentCaptor.forClass(PutObjectRequest.class);
        var body = ArgumentCaptor.forClass(RequestBody.class);
        verify(s3).putObject(request.capture(), body.capture());
        assertThat(request.getValue().bucket()).isEqualTo("catalog");
        assertThat(request.getValue().key()).isEqualTo(key);
        assertThat(request.getValue().contentType()).isEqualTo("image/png");
        assertThat(request.getValue().acl()).isNull();
        assertThat(body.getValue().contentStreamProvider().newStream().readAllBytes()).containsExactly(1,2,3);
    }
    @Test void rejectsInvalidKeyAndSanitizesUpstreamFailure() {
        var s3 = mock(S3Client.class);
        var client = new R2MediaClient("catalog", "https://media.example.test", s3);
        assertThatThrownBy(() -> client.upload("products/../secret", new byte[]{1}, "image/png")).isInstanceOf(BusinessException.class).hasMessage("Media storage is unavailable");
        verifyNoInteractions(s3);
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class))).thenThrow(new IllegalStateException("private-secret"));
        assertThatThrownBy(() -> client.upload(key, new byte[]{1}, "image/png")).hasMessage("Media storage is unavailable");
    }
    @Test void rejectsUnsafeConfiguration() {
        for (String url : new String[]{"http://media.test", "https://user@media.test", "https://media.test/path", "https://media.test?q=x"}) {
            assertThatThrownBy(() -> new R2MediaClient("catalog", url, mock(S3Client.class))).isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> new R2MediaClient("../catalog", "https://media.test", mock(S3Client.class))).isInstanceOf(IllegalArgumentException.class);
    }
}
