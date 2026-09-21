package com.shop.controller;

import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.dto.OrderDtos.OrderReceipt;
import com.shop.service.IdempotentOrderService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final IdempotentOrderService service;

    public OrderController(IdempotentOrderService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(
            summary = "Create an order or quote request",
            description = "The idempotency key is persisted with a canonical request hash. A replay returns 200; a new request returns 201.",
            parameters = @Parameter(
                    name = "Idempotency-Key",
                    required = true,
                    description = "Canonical UUID used to safely retry the same request",
                    example = "00000000-0000-4000-8000-000000000001"),
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateOrder.class),
                            examples = @ExampleObject(value = """
                                    {"orderType":"ORDER","customerName":"Nguyen Van A","phone":"0912345678","items":[{"variantId":"13","quantity":2}]}
                                    """))))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Order or quote request created",
                    content = @Content(schema = @Schema(implementation = OrderReceipt.class))),
            @ApiResponse(responseCode = "200", description = "Committed request replayed with the original receipt",
                    content = @Content(schema = @Schema(implementation = OrderReceipt.class))),
            @ApiResponse(responseCode = "400", description = "Missing or malformed Idempotency-Key"),
            @ApiResponse(responseCode = "409", description = "Idempotency-Key was used with a different payload"),
            @ApiResponse(responseCode = "422", description = "Order, catalog, quantity or voucher validation failed")
    })
    public ResponseEntity<OrderReceipt> create(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateOrder request) {
        CreateResult result = service.create(request, idempotencyKey);
        return ResponseEntity.status(result.replayed() ? 200 : 201).body(result.receipt());
    }
}
