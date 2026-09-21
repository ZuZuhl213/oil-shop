package com.shop;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.entity.OrderType;
import com.shop.exception.BusinessException;
import com.shop.repository.CategoryRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.IdempotentOrderService;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderConcurrencyIT extends PostgresIntegrationTest {
    @Autowired CatalogFixture fixture;
    @Autowired IdempotentOrderService service;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired VoucherRepository vouchers;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;

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
    void twoDifferentKeysConsumeOnlyOneVoucher() throws Exception {
        Data data = fixture.create();
        data.welcome().setQuantity(1);
        vouchers.saveAndFlush(data.welcome());
        CreateOrder request = request(data, "A");
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CyclicBarrier barrier = new CyclicBarrier(2);
            Future<Object> first = executor.submit(() -> runAfterBarrier(barrier, () -> service.create(request, "00000000-0000-4000-8000-000000000201")));
            Future<Object> second = executor.submit(() -> runAfterBarrier(barrier, () -> service.create(request, "00000000-0000-4000-8000-000000000202")));
            Object a = first.get(10, TimeUnit.SECONDS);
            Object b = second.get(10, TimeUnit.SECONDS);
            assertThat(List.of(a, b).stream().filter(CreateResult.class::isInstance)).hasSize(1);
            assertThat(List.of(a, b).stream().filter(BusinessException.class::isInstance)
                    .map(value -> ((BusinessException) value).code())).containsExactly("VOUCHER_EXHAUSTED");
            assertThat(orders.count()).isEqualTo(1);
            assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void sameKeyConcurrentRequestsCreateOneOrderAndReplayOneReceipt() throws Exception {
        Data data = fixture.create();
        data.welcome().setQuantity(1);
        vouchers.saveAndFlush(data.welcome());
        CreateOrder request = request(data, "A");
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CyclicBarrier barrier = new CyclicBarrier(2);
            String key = "00000000-0000-4000-8000-000000000203";
            Future<CreateResult> first = executor.submit(() -> runSuccessAfterBarrier(barrier, () -> service.create(request, key)));
            Future<CreateResult> second = executor.submit(() -> runSuccessAfterBarrier(barrier, () -> service.create(request, key)));
            CreateResult a = first.get(10, TimeUnit.SECONDS);
            CreateResult b = second.get(10, TimeUnit.SECONDS);
            assertThat(List.of(a.replayed(), b.replayed())).containsExactlyInAnyOrder(false, true);
            assertThat(a.receipt().orderCode()).isEqualTo(b.receipt().orderCode());
            assertThat(orders.count()).isEqualTo(1);
            assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void sameKeyDifferentPayloadReturnsConflictUnderRace() throws Exception {
        Data data = fixture.create();
        data.welcome().setQuantity(1);
        vouchers.saveAndFlush(data.welcome());
        CreateOrder firstRequest = request(data, "A");
        CreateOrder secondRequest = request(data, "B");
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CyclicBarrier barrier = new CyclicBarrier(2);
            String key = "00000000-0000-4000-8000-000000000204";
            Future<Object> first = executor.submit(() -> runAfterBarrier(barrier, () -> service.create(firstRequest, key)));
            Future<Object> second = executor.submit(() -> runAfterBarrier(barrier, () -> service.create(secondRequest, key)));
            Object a = first.get(10, TimeUnit.SECONDS);
            Object b = second.get(10, TimeUnit.SECONDS);
            assertThat(List.of(a, b).stream().filter(CreateResult.class::isInstance)).hasSize(1);
            assertThat(List.of(a, b).stream().filter(BusinessException.class::isInstance)
                    .map(value -> ((BusinessException) value).code())).containsExactly("IDEMPOTENCY_CONFLICT");
            assertThat(orders.count()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    private CreateOrder request(Data data, String customerName) {
        return new CreateOrder(OrderType.ORDER, customerName, "0912345678", null, null, "WELCOME",
                List.of(new ItemInput(data.bottleOneLiter().getId().toString(), new BigDecimal("2")),
                        new ItemInput(data.bottleHalfLiter().getId().toString(), new BigDecimal("1"))));
    }

    private Object runAfterBarrier(CyclicBarrier barrier, ThrowingSupplier action) throws Exception {
        barrier.await(10, TimeUnit.SECONDS);
        try {
            return action.get();
        } catch (BusinessException exception) {
            return exception;
        }
    }

    private CreateResult runSuccessAfterBarrier(CyclicBarrier barrier, ThrowingSupplier action) throws Exception {
        barrier.await(10, TimeUnit.SECONDS);
        return (CreateResult) action.get();
    }

    @FunctionalInterface
    private interface ThrowingSupplier { Object get(); }
}
