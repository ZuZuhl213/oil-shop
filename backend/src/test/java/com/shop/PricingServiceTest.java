package com.shop;

import com.shop.dto.CatalogLine;
import com.shop.dto.ItemInput;
import com.shop.dto.PricedLine;
import com.shop.entity.SaleType;
import com.shop.exception.BusinessException;
import com.shop.service.CatalogQueryService;
import com.shop.service.PricingService;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PricingServiceTest {

    @ParameterizedTest
    @ValueSource(strings = {"1.5", "0.75"})
    void rejectsQuantityThatDoesNotMatchTheVariantRule(String quantity) {
        PricingService pricing = pricing(fixed(10L, "1.00", "1.00", 100L));

        assertThatThrownBy(() -> pricing.calculate(List.of(new ItemInput("10", new BigDecimal(quantity)))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VALIDATION_ERROR"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0.50", "1.00", "1.50"})
    void acceptsQuantitiesOnHalfUnitVariantRule(String quantity) {
        PricingService pricing = pricing(fixed(10L, "0.50", "0.50", 100L));

        var result = pricing.calculate(List.of(new ItemInput("10", new BigDecimal(quantity))));

        assertThat(result.lines()).singleElement().extracting(PricedLine::quantity)
                .isEqualTo(new BigDecimal(quantity));
    }

    @Test
    void rejectsFixedPriceLineThatWouldHaveFractionalVnd() {
        PricingService pricing = pricing(fixed(10L, "0.50", "0.50", 101L));

        assertThatThrownBy(() -> pricing.calculate(List.of(new ItemInput("10", new BigDecimal("0.50")))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VALIDATION_ERROR"));
    }

    @Test
    void mapsFractionalVndErrorToTheFailingCartLine() {
        PricingService pricing = pricing(
                fixed(10L, "1.00", "1.00", 100L),
                fixed(11L, "0.50", "0.50", 101L));

        assertThatThrownBy(() -> pricing.calculate(List.of(
                new ItemInput("10", new BigDecimal("1")),
                new ItemInput("11", new BigDecimal("0.5")))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> {
                    BusinessException business = (BusinessException) error;
                    assertThat(business.fieldErrors())
                            .containsEntry("items[1].quantity", "Price multiplied by quantity must be whole VND within the limit")
                            .containsEntry("items[1].variantId", "11");
                });
    }

    @Test
    void rejectsQuarterUnitOnHalfUnitVariantRule() {
        PricingService pricing = pricing(fixed(10L, "0.50", "0.50", 100L));

        assertThatThrownBy(() -> pricing.calculate(List.of(new ItemInput("10", new BigDecimal("0.75")))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VALIDATION_ERROR"));
    }

    @Test
    void calculatesFixtureSubtotalFromCatalogPrices() {
        PricingService pricing = pricing(
                fixed(10L, "1.00", "1.00", 170_000L),
                fixed(11L, "1.00", "1.00", 90_000L));

        var result = pricing.calculate(List.of(
                new ItemInput("10", new BigDecimal("2")),
                new ItemInput("11", new BigDecimal("1"))));

        assertThat(result.subtotal()).isEqualTo(430_000L);
        assertThat(result.saleType()).isEqualTo(SaleType.FIXED_PRICE);
        assertThat(result.lines()).extracting(PricedLine::lineTotal)
                .containsExactly(340_000L, 90_000L);
    }

    @Test
    void keepsQuoteAmountsNullAndDoesNotUseClientPrice() {
        PricingService pricing = pricing(new CatalogLine(10L, 20L, "Lạc", "Theo cân", SaleType.QUOTE,
                null, new BigDecimal("0.50"), new BigDecimal("0.50")));

        var result = pricing.calculate(List.of(new ItemInput("10", new BigDecimal("1.5"))));

        assertThat(result.saleType()).isEqualTo(SaleType.QUOTE);
        assertThat(result.subtotal()).isNull();
        assertThat(result.lines()).singleElement().extracting(PricedLine::unitPrice, PricedLine::lineTotal)
                .containsExactly(null, null);
    }

    @Test
    void rejectsMixedFixedAndQuoteItems() {
        PricingService pricing = pricing(
                fixed(10L, "1.00", "1.00", 100L),
                new CatalogLine(11L, 21L, "Lạc", "Theo cân", SaleType.QUOTE,
                        null, new BigDecimal("0.50"), new BigDecimal("0.50")));

        assertThatThrownBy(() -> pricing.calculate(List.of(
                new ItemInput("10", new BigDecimal("1")),
                new ItemInput("11", new BigDecimal("0.5")))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("MIXED_SALE_TYPES"));
    }

    @Test
    void rejectsDuplicateVariantIdsInsteadOfDoubleCountingSilently() {
        PricingService pricing = pricing(fixed(10L, "1.00", "1.00", 100L));

        assertThatThrownBy(() -> pricing.calculate(List.of(
                new ItemInput("10", new BigDecimal("1")),
                new ItemInput("10", new BigDecimal("1")))))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VALIDATION_ERROR"));
    }

    private PricingService pricing(CatalogLine... lines) {
        Map<Long, CatalogLine> byId = Arrays.stream(lines).collect(java.util.stream.Collectors.toMap(CatalogLine::variantId, line -> line));
        CatalogQueryService catalog = new CatalogQueryService(null, null, null, null) {
            @Override
            public List<CatalogLine> loadSellable(List<Long> ids) {
                return ids.stream().map(byId::get).toList();
            }
        };
        return new PricingService(catalog);
    }

    private static CatalogLine fixed(Long id, String min, String step, Long price) {
        return new CatalogLine(id, 20L, "Dầu lạc", "Chai", SaleType.FIXED_PRICE, price,
                new BigDecimal(min), new BigDecimal(step));
    }
}
