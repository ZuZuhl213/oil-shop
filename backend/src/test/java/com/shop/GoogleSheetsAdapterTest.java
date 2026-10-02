package com.shop;

import com.shop.integration.google.*;
import com.shop.repository.SheetSyncJobRepository;
import java.net.http.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.Flow;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class GoogleSheetsAdapterTest {
    private final ObjectMapper json=new ObjectMapper();
    GoogleSheetRow row() {
        List<Object> cells=new ArrayList<>(Collections.nCopies(GoogleSheetRow.HEADERS.size(),""));
        cells.set(0,"41");cells.set(1,"BG-20261002-41");cells.set(3,"=SUM(1,1)");
        cells.set(4,"0912345678");cells.set(12,"QUOTE_REQUEST");cells.set(13,"+note");cells.set(14,"@admin");
        return new GoogleSheetRow(cells);
    }
    @SuppressWarnings("unchecked")
    HttpResponse<String> response(int status,String body) {
        var response=(HttpResponse<String>)mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);when(response.body()).thenReturn(body);return response;
    }
    String body(HttpRequest request) throws Exception {
        var result=new CompletableFuture<String>();var bytes=new java.io.ByteArrayOutputStream();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            public void onSubscribe(Flow.Subscription s){s.request(Long.MAX_VALUE);}
            public void onNext(ByteBuffer b){var data=new byte[b.remaining()];b.get(data);bytes.writeBytes(data);}
            public void onError(Throwable t){result.completeExceptionally(t);}
            public void onComplete(){result.complete(bytes.toString(StandardCharsets.UTF_8));}
        });
        return result.get();
    }
    @Test void ensuresCapacityAndOverwritesFixedRawRangeUsingRawValues() throws Exception {
        var http=mock(HttpClient.class);List<HttpRequest> requests=new ArrayList<>();
        when(http.send(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(inv->{
            var request=(HttpRequest)inv.getArgument(0);requests.add(request);
            return response(200,request.method().equals("GET") ?
                "{\"sheets\":[{\"properties\":{\"sheetId\":7,\"title\":\"Orders_Raw\",\"gridProperties\":{\"rowCount\":10,\"columnCount\":12}}}]}" : "{}");
        });
        var client=new GoogleSheetsApiClient("test-sheet",()->"token",http,json);
        client.writeOrder(42,row()); client.writeOrder(42,row());
        assertThat(requests).hasSize(6);
        assertThat(requests.get(1).method()).isEqualTo("POST");
        var grid=json.readTree(body(requests.get(1))).get("requests").get(0).get("updateSheetProperties");
        assertThat(grid.get("properties").get("sheetId").asInt()).isEqualTo(7);
        assertThat(grid.get("properties").get("gridProperties").get("rowCount").asLong()).isGreaterThanOrEqualTo(42);
        assertThat(grid.get("properties").get("gridProperties").get("columnCount").asInt()).isGreaterThanOrEqualTo(18);
        var write=requests.get(2);
        assertThat(write.method()).isEqualTo("PUT");
        assertThat(write.uri().getPath()).isEqualTo("/v4/spreadsheets/test-sheet/values/'Orders_Raw'!A42:R42");
        assertThat(write.uri().getQuery()).isEqualTo("valueInputOption=RAW");
        assertThat(write.timeout()).contains(Duration.ofSeconds(15));
        assertThat(write.headers().firstValue("Authorization")).contains("Bearer token");
        var values=json.readTree(body(write)).get("values").get(0);
        assertThat(values.get(3).asText()).isEqualTo("=SUM(1,1)");
        assertThat(values.get(4).asText()).isEqualTo("0912345678");
        assertThat(values.get(10).asText()).isEmpty();
        assertThat(values.get(13).asText()).isEqualTo("+note");
        assertThat(values.get(14).asText()).isEqualTo("@admin");
        assertThat(requests.get(5).uri()).isEqualTo(write.uri());
    }
    @Test void doesNotShrinkExistingGridAndMapsRemoteFailuresToSafeCodes() throws Exception {
        for(int status:List.of(403,429,400,503)) {
            var http=mock(HttpClient.class);
            var remote=response(status,"private PII token");
            when(http.send(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenReturn(remote);
            var client=new GoogleSheetsApiClient("sheet",()->"secret",http,json);
            assertThatThrownBy(()->client.writeOrder(2,row())).isInstanceOf(GoogleSheetsException.class)
                .hasMessage("SHEETS_HTTP_"+status);
        }
        var http=mock(HttpClient.class);List<HttpRequest> requests=new ArrayList<>();
        when(http.send(any(HttpRequest.class),any(HttpResponse.BodyHandler.class))).thenAnswer(inv->{
            var r=(HttpRequest)inv.getArgument(0);requests.add(r);
            return response(200,r.method().equals("GET")?"{\"sheets\":[{\"properties\":{\"sheetId\":0,\"title\":\"Orders_Raw\",\"gridProperties\":{\"rowCount\":1000,\"columnCount\":26}}}]}":"{}");
        });
        new GoogleSheetsApiClient("sheet",()->"token",http,json).writeOrder(2,row());
        assertThat(requests).hasSize(2);assertThat(requests.get(1).method()).isEqualTo("PUT");
    }
    @Test void invalidConfigurationAndHeaderRowFailWithoutNetwork() {
        var http=mock(HttpClient.class);
        assertThatThrownBy(()->new GoogleSheetsApiClient("",()->"token",http,json).writeOrder(2,row()))
            .hasMessage("SHEETS_CONFIGURATION");
        assertThatThrownBy(()->new GoogleSheetsApiClient("sheet",()->"token",http,json).writeOrder(1,row()))
            .hasMessage("SHEETS_CAPACITY");
        verifyNoInteractions(http);
    }
    @Test void retryScheduleCapsWithoutDroppingJobs() {
        assertThat(List.of(0,1,2,3,4,100).stream().map(i->SheetSyncJobRepository.retryDelay(i).toSeconds()).toList())
            .containsExactly(5L,30L,120L,600L,3600L,3600L);
    }
}
