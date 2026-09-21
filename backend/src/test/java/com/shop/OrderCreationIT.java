package com.shop;

import com.shop.entity.Order;
import com.shop.entity.OrderType;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.OrderService;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderCreationIT extends PostgresIntegrationTest {
    private static final DateTimeFormatter ORDER_DATE = DateTimeFormatter.ofPattern("yyyyMMdd")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired VoucherRepository vouchers;
    @Autowired CategoryRepository categories;
    @Autowired OrderService orderService;
    @MockitoSpyBean Clock clock;

    @BeforeEach
    void reset() {
        orderItems.deleteAll();
        orders.deleteAll();
        variants.deleteAll();
        products.deleteAll();
        categories.deleteAll();
        vouchers.deleteAll();
    }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void createsFixedOrderWithSnapshotAndVoucherDiscount() throws Exception {
        Data data = fixture.create();
        MockHttpSession session = csrfSession();

        MvcResult result = mockMvc.perform(post("/api/v1/orders")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf(session))
                        .header("Idempotency-Key", "00000000-0000-4000-8000-000000000001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "orderType":"ORDER",
                                  "customerName":" Nguyễn Văn A ",
                                  "phone":"0912345678",
                                  "note":" Gọi trước ",
                                  "voucherCode":" welcome ",
                                  "items":[
                                    {"variantId":"%s","quantity":2},
                                    {"variantId":"%s","quantity":1}
                                  ]
                                }
                                """.formatted(data.bottleOneLiter().getId(), data.bottleHalfLiter().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderType").value("ORDER"))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.subtotal").value(430_000))
                .andExpect(jsonPath("$.discountAmount").value(43_000))
                .andExpect(jsonPath("$.totalAmount").value(387_000))
                .andReturn();

        JsonNode receipt = mapper.readTree(result.getResponse().getContentAsByteArray());
        String orderCode = receipt.get("orderCode").asText();
        Order order = orders.findByOrderCode(orderCode).orElseThrow();
        assertThat(order.getCustomerName()).isEqualTo("Nguyễn Văn A");
        assertThat(order.getAddress()).isNull();
        assertThat(order.getCustomerNote()).isEqualTo("Gọi trước");
        assertThat(order.getVoucherCodeSnapshot()).isEqualTo("WELCOME");
        assertThat(orderCode).isEqualTo("DH-%s-%d".formatted(ORDER_DATE.format(order.getCreatedAt()), order.getId()));
        assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isEqualTo(1);

        var items = orderItems.findAllByOrder_IdOrderByIdAsc(order.getId());
        assertThat(items).extracting(item -> item.getProductNameSnapshot())
                .containsExactly("Dầu lạc ép lạnh", "Dầu lạc ép lạnh");
        assertThat(items).extracting(item -> item.getVariantNameSnapshot())
                .containsExactly("Chai 1L", "Chai 500ml");
        assertThat(items).extracting(item -> item.getUnitPrice())
                .containsExactly(170_000L, 90_000L);
        assertThat(items).extracting(item -> item.getLineTotal())
                .containsExactly(340_000L, 90_000L);

        data.fixedProduct().setName("Tên mới");
        data.bottleOneLiter().setName("Variant mới");
        data.bottleOneLiter().setPrice(999_000L);
        products.saveAndFlush(data.fixedProduct());
        variants.saveAndFlush(data.bottleOneLiter());

        var snapshot = orderItems.findAllByOrder_IdOrderByIdAsc(order.getId()).get(0);
        assertThat(snapshot.getProductNameSnapshot()).isEqualTo("Dầu lạc ép lạnh");
        assertThat(snapshot.getVariantNameSnapshot()).isEqualTo("Chai 1L");
        assertThat(snapshot.getUnitPrice()).isEqualTo(170_000L);
        assertThat(snapshot.getLineTotal()).isEqualTo(340_000L);
    }

    @Test
    void createsQuoteWithoutAddressAndStoresNullMoney() throws Exception {
        Data data = fixture.create();
        MockHttpSession session = csrfSession();

        MvcResult result = mockMvc.perform(post("/api/v1/orders")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf(session))
                        .header("Idempotency-Key", "00000000-0000-4000-8000-000000000002")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "orderType":"QUOTE_REQUEST",
                                  "customerName":"Nguyễn Văn B",
                                  "phone":"+84912345678",
                                  "items":[{"variantId":"%s","quantity":0.5}]
                                }
                                """.formatted(data.weighted().getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderType").value("QUOTE_REQUEST"))
                .andExpect(jsonPath("$.discountAmount").value(0))
                .andExpect(jsonPath("$.subtotal").doesNotExist())
                .andExpect(jsonPath("$.totalAmount").doesNotExist())
                .andReturn();

        String orderCode = mapper.readTree(result.getResponse().getContentAsByteArray()).get("orderCode").asText();
        Order order = orders.findByOrderCode(orderCode).orElseThrow();
        assertThat(order.getAddress()).isNull();
        assertThat(order.getSubtotal()).isNull();
        assertThat(order.getTotalAmount()).isNull();
        assertThat(order.getDiscountAmount()).isZero();
        var item = orderItems.findAllByOrder_IdOrderByIdAsc(order.getId()).get(0);
        assertThat(item.getQuantity()).isEqualByComparingTo("0.50");
        assertThat(item.getUnitPrice()).isNull();
        assertThat(item.getLineTotal()).isNull();
    }

    @Test
    void persistsTheClockInstantUsedToGenerateOrderCode() {
        Data data = fixture.create();
        Instant atVietnameseMidnight = Instant.parse("2026-09-21T17:00:00Z");
        doReturn(atVietnameseMidnight).when(clock).instant();

        CreateResult result = orderService.create(new CreateOrder(
                OrderType.ORDER, "A", "0912345678", null, null, null,
                List.of(new ItemInput(data.bottleOneLiter().getId().toString(), BigDecimal.ONE))),
                "00000000-0000-4000-8000-000000000005");

        Order order = orders.findByOrderCode(result.receipt().orderCode()).orElseThrow();
        assertThat(order.getCreatedAt()).isEqualTo(atVietnameseMidnight);
        assertThat(order.getOrderCode()).isEqualTo("DH-20260922-" + order.getId());
    }

    @Test
    void rejectsInvalidAddressQuantityDuplicatesAndUnavailableItems() throws Exception {
        Data data = fixture.create();
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"address\":\"   \",\"items\":[{\"variantId\":\"%s\",\"quantity\":1}]}".formatted(data.bottleOneLiter().getId()), "address");
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"address\":\"%s\",\"items\":[{\"variantId\":\"%s\",\"quantity\":1}]}".formatted("x".repeat(1001), data.bottleOneLiter().getId()), "address");
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"%s\",\"quantity\":0.5}]}".formatted(data.bottleOneLiter().getId()), "items[0].quantity");
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"%s\",\"quantity\":1},{\"variantId\":\"%s\",\"quantity\":1}]}".formatted(data.bottleOneLiter().getId(), data.bottleOneLiter().getId()), "items[1].variantId");
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[null,null]}", "items[0]");
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"999999999\",\"quantity\":1}]}", "code");
    }

    @Test
    void rejectsOrderTypeThatDoesNotMatchCatalogSaleType() throws Exception {
        Data data = fixture.create();
        assertInvalid(data, "{\"orderType\":\"ORDER\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"%s\",\"quantity\":0.5}]}".formatted(data.weighted().getId()), "code");
        assertInvalid(data, "{\"orderType\":\"QUOTE_REQUEST\",\"customerName\":\"A\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"%s\",\"quantity\":1}]}".formatted(data.bottleOneLiter().getId()), "code");
    }

    private void assertInvalid(Data data, String body, String field) throws Exception {
        MockHttpSession session = csrfSession();
        var result = mockMvc.perform(post("/api/v1/orders")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf(session))
                        .header("Idempotency-Key", "00000000-0000-4000-8000-%012d".formatted(System.nanoTime() % 1_000_000_000_000L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableContent())
                .andReturn();
        if (field.startsWith("items") || field.equals("address")) {
            JsonNode errors = mapper.readTree(result.getResponse().getContentAsByteArray()).get("fieldErrors");
            assertThat(errors).isNotNull();
            assertThat(errors.has(field)).isTrue();
        }
        assertThat(orders.count()).isZero();
    }

    private MockHttpSession csrfSession() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/csrf")).andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String csrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/csrf").session(session)).andExpect(status().isOk()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsByteArray()).get("token").asText();
    }
}
