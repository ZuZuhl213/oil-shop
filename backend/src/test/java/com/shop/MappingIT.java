package com.shop;

import com.shop.entity.Admin;
import com.shop.entity.DiscountType;
import com.shop.entity.Order;
import com.shop.entity.OrderItem;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.entity.ProductStatus;
import com.shop.entity.Voucher;
import com.shop.repository.AdminRepository;
import com.shop.repository.CategoryRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Import(CatalogFixture.class)
@Transactional
class MappingIT extends PostgresIntegrationTest {

    @Autowired
    private CatalogFixture fixture;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void mapsVietnameseCatalogAndDecimalVariantRules() {
        Data data = fixture.create();
        entityManager.flush();
        entityManager.clear();

        assertThat(categoryRepository.findById(data.oils().getId()).orElseThrow().getName())
                .isEqualTo("Dầu thực vật");
        assertThat(productRepository.findById(data.fixedProduct().getId()).orElseThrow().getName())
                .isEqualTo("Dầu lạc ép lạnh");
        assertThat(variantRepository.findById(data.weighted().getId()).orElseThrow())
                .satisfies(variant -> {
                    assertThat(variant.getMinQuantity()).isEqualByComparingTo("0.50");
                    assertThat(variant.getQuantityStep()).isEqualByComparingTo("0.50");
                    assertThat(variant.getPrice()).isNull();
                });
        assertThat(categoryRepository.count()).isEqualTo(3);
    }

    @Test
    void mapsAdminWithoutExposingOrTransformingStoredHash() {
        Admin admin = adminRepository.saveAndFlush(new Admin(
                "quantri@example.com",
                "$2a$10$already.hashed.value",
                "Quản trị viên",
                true));
        entityManager.clear();

        Admin reloaded = adminRepository.findById(admin.getId()).orElseThrow();
        assertThat(reloaded.getEmail()).isEqualTo("quantri@example.com");
        assertThat(reloaded.getName()).isEqualTo("Quản trị viên");
        assertThat(reloaded.getPasswordHash()).isEqualTo("$2a$10$already.hashed.value");
        assertThat(reloaded.isActive()).isTrue();
    }

    @Test
    void roundTripsQuantityBoundsAndQuoteNullAmounts() {
        Data data = fixture.create();
        Order quote = orderRepository.save(new Order(
                "BG-20260920-101",
                OrderType.QUOTE_REQUEST,
                "Nguyễn Văn An",
                "0912345678",
                null,
                null,
                0L,
                null,
                null,
                null,
                OrderStatus.NEW,
                null,
                null));
        OrderItem minimum = orderItemRepository.save(new OrderItem(
                quote,
                data.quoteProduct(),
                data.weighted(),
                "Lạc nhân",
                "Theo cân",
                new BigDecimal("0.01"),
                null,
                null));
        OrderItem maximum = orderItemRepository.save(new OrderItem(
                quote,
                data.quoteProduct(),
                data.weighted(),
                "Lạc nhân",
                "Theo cân",
                new BigDecimal("99999999.99"),
                null,
                null));
        entityManager.flush();
        entityManager.clear();

        Order reloadedQuote = orderRepository.findById(quote.getId()).orElseThrow();
        assertThat(reloadedQuote.getSubtotal()).isNull();
        assertThat(reloadedQuote.getTotalAmount()).isNull();
        assertThat(orderItemRepository.findById(minimum.getId()).orElseThrow().getQuantity())
                .isEqualByComparingTo("0.01");
        assertThat(orderItemRepository.findById(maximum.getId()).orElseThrow().getQuantity())
                .isEqualByComparingTo("99999999.99");
    }

    @Test
    void roundTripsInstantWhenDatabaseSessionUsesAnotherTimezone() {
        entityManager.createNativeQuery("SET LOCAL TIME ZONE 'Asia/Tokyo'").executeUpdate();
        Instant start = Instant.parse("2026-09-20T15:30:45.123456Z");
        Instant end = Instant.parse("2026-10-20T15:30:45.123456Z");
        Voucher voucher = voucherRepository.saveAndFlush(new Voucher(
                "TIMEZONE",
                DiscountType.FIXED,
                10_000L,
                null,
                0L,
                5,
                0,
                start,
                end,
                true));
        entityManager.clear();

        Voucher reloaded = voucherRepository.findById(voucher.getId()).orElseThrow();
        assertThat(reloaded.getStartAt()).isEqualTo(start);
        assertThat(reloaded.getEndAt()).isEqualTo(end);
    }

    @Test
    void productChangesDoNotAlterPersistedOrderSnapshotsOrHistory() {
        Data data = fixture.create();
        Order order = orderRepository.save(new Order(
                "DH-20260920-102",
                OrderType.ORDER,
                "Trần Thị Bình",
                "+84912345678",
                "Hà Nội",
                340_000L,
                0L,
                340_000L,
                null,
                null,
                OrderStatus.NEW,
                "Gọi trước khi giao",
                null));
        OrderItem item = orderItemRepository.save(new OrderItem(
                order,
                data.fixedProduct(),
                data.bottleOneLiter(),
                "Dầu lạc ép lạnh",
                "Chai 1L",
                new BigDecimal("2.00"),
                170_000L,
                340_000L));
        entityManager.flush();

        data.fixedProduct().setName("Dầu lạc tên mới");
        data.fixedProduct().setStatus(ProductStatus.INACTIVE);
        data.bottleOneLiter().setPrice(190_000L);
        data.bottleOneLiter().setActive(false);
        productRepository.save(data.fixedProduct());
        variantRepository.save(data.bottleOneLiter());
        entityManager.flush();
        entityManager.clear();

        OrderItem reloaded = orderItemRepository.findById(item.getId()).orElseThrow();
        assertThat(reloaded.getProductNameSnapshot()).isEqualTo("Dầu lạc ép lạnh");
        assertThat(reloaded.getVariantNameSnapshot()).isEqualTo("Chai 1L");
        assertThat(reloaded.getUnitPrice()).isEqualTo(170_000L);
        assertThat(reloaded.getLineTotal()).isEqualTo(340_000L);
        assertThat(orderRepository.existsById(order.getId())).isTrue();
        assertThat(orderItemRepository.existsById(item.getId())).isTrue();
    }

    @Test
    void jpaUpdateUsesDatabaseUpdatedAtTrigger() {
        Data data = fixture.create();
        entityManager.flush();
        entityManager.clear();

        var category = categoryRepository.findById(data.oils().getId()).orElseThrow();
        Instant before = category.getUpdatedAt();
        category.setName("Dầu và chất béo thực vật");
        categoryRepository.saveAndFlush(category);
        entityManager.clear();

        var reloaded = categoryRepository.findById(category.getId()).orElseThrow();
        assertThat(reloaded.getUpdatedAt()).isAfter(before);
    }
}
