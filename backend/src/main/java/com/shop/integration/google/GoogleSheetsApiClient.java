package com.shop.integration.google;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class GoogleSheetsApiClient implements GoogleSheetClient {
    @FunctionalInterface public interface AccessToken { String get() throws Exception; }
    private final String spreadsheet;
    private final AccessToken tokens;
    private final HttpClient http;
    private final ObjectMapper json;

    @Autowired
    public GoogleSheetsApiClient(@Value("${app.sheets.spreadsheet-id:}") String spreadsheet,
            GoogleSheetsCredentials credentials, ObjectMapper json) {
        this(spreadsheet,credentials::accessToken,HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER).build(),json);
    }
    public GoogleSheetsApiClient(String spreadsheet,AccessToken tokens,HttpClient http,ObjectMapper json) {
        this.spreadsheet=spreadsheet;this.tokens=tokens;this.http=http;this.json=json;
    }

    @Override public void writeOrder(long row,GoogleSheetRow snapshot) throws Exception {
        if(!spreadsheet.matches("[A-Za-z0-9_-]+")) throw new GoogleSheetsException("SHEETS_CONFIGURATION");
        if(row<2 || row>Integer.MAX_VALUE) throw new GoogleSheetsException("SHEETS_CAPACITY");
        try {
            String token=tokens.get();
            if(token==null || token.isBlank()) throw new GoogleSheetsException("SHEETS_CREDENTIALS");
            String base="https://sheets.googleapis.com/v4/spreadsheets/"+spreadsheet;
            var metadata=send("GET",base+"?fields=sheets(properties(sheetId,title,gridProperties))",null,token);
            JsonNode raw=null;
            for(var sheet:metadata.path("sheets")) {
                var props=sheet.path("properties");
                if("Orders_Raw".equals(props.path("title").asText())) {raw=props;break;}
            }
            if(raw==null) throw new GoogleSheetsException("SHEETS_RAW_TAB_MISSING");
            long currentRows=raw.path("gridProperties").path("rowCount").asLong();
            int currentColumns=raw.path("gridProperties").path("columnCount").asInt();
            if(currentRows<row || currentColumns<GoogleSheetRow.HEADERS.size()) {
                var properties=Map.of("sheetId",raw.path("sheetId").asInt(),"gridProperties",
                    Map.of("rowCount",Math.max(row,currentRows),"columnCount",Math.max(currentColumns,GoogleSheetRow.HEADERS.size())));
                send("POST",base+":batchUpdate",Map.of("requests",List.of(Map.of("updateSheetProperties",
                    Map.of("properties",properties,"fields","gridProperties.rowCount,gridProperties.columnCount")))),token);
            }
            String range="'Orders_Raw'!A"+row+":R"+row;
            send("PUT",base+"/values/"+URLEncoder.encode(range,StandardCharsets.UTF_8)+"?valueInputOption=RAW",
                Map.of("range",range,"majorDimension","ROWS","values",List.of(snapshot.cells())),token);
        } catch(GoogleSheetsException safe) {throw safe;}
        catch(InterruptedException interrupted) {Thread.currentThread().interrupt();throw interrupted;}
        catch(Exception failure) {throw new GoogleSheetsException("SHEETS_UNAVAILABLE");}
    }
    private JsonNode send(String method,String uri,Object body,String token) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create(uri)).timeout(Duration.ofSeconds(15))
            .header("Authorization","Bearer "+token).header("Content-Type","application/json");
        builder.method(method,body==null ? HttpRequest.BodyPublishers.noBody() :
            HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        var response=http.send(builder.build(),HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if(response.statusCode()<200 || response.statusCode()>=300)
            throw new GoogleSheetsException("SHEETS_HTTP_"+response.statusCode());
        return json.readTree(response.body());
    }
}
