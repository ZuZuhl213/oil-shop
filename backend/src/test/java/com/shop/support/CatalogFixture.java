package com.shop.support;

import com.shop.entity.Category;
import com.shop.entity.DiscountType;
import com.shop.entity.Product;
import com.shop.entity.ProductStatus;
import com.shop.entity.ProductVariant;
import com.shop.entity.SaleType;
import com.shop.entity.Voucher;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import java.math.BigDecimal;
import org.springframework.boot.test.context.TestComponent;

@TestComponent
public class CatalogFixture {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final VoucherRepository voucherRepository;

    public CatalogFixture(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            VoucherRepository voucherRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.voucherRepository = voucherRepository;
    }

    public Data create() {
        Category oils = categoryRepository.save(new Category(
                "Dầu thực vật", "dau-thuc-vat", "Dầu ép nguyên chất", 0, true));
        Category seeds = categoryRepository.save(new Category(
                "Hạt / nguyên liệu", "hat-nguyen-lieu", null, 1, true));
        Category byproducts = categoryRepository.save(new Category(
                "Phụ phẩm", "phu-pham", null, 2, true));

        Product fixedProduct = productRepository.save(new Product(
                oils,
                "Dầu lạc ép lạnh",
                "dau-lac-ep-lanh",
                "Dầu lạc nguyên chất",
                "Ép chậm từ lạc tuyển chọn",
                "https://storage.example.test/dau-lac.jpg",
                SaleType.FIXED_PRICE,
                ProductStatus.ACTIVE,
                0));
        Product quoteProduct = productRepository.save(new Product(
                seeds,
                "Lạc nhân",
                "lac-nhan",
                null,
                "Liên hệ để nhận báo giá theo mùa vụ",
                null,
                SaleType.QUOTE,
                ProductStatus.ACTIVE,
                0));

        ProductVariant bottleOneLiter = variantRepository.save(new ProductVariant(
                fixedProduct,
                "Chai 1L",
                "DL-1L",
                170_000L,
                new BigDecimal("1.00"),
                new BigDecimal("1.00"),
                true,
                0));
        ProductVariant bottleHalfLiter = variantRepository.save(new ProductVariant(
                fixedProduct,
                "Chai 500ml",
                "DL-500ML",
                90_000L,
                new BigDecimal("1.00"),
                new BigDecimal("1.00"),
                true,
                1));
        ProductVariant weighted = variantRepository.save(new ProductVariant(
                quoteProduct,
                "Theo cân",
                "LN-KG",
                null,
                new BigDecimal("0.50"),
                new BigDecimal("0.50"),
                true,
                0));

        Voucher welcome = voucherRepository.save(new Voucher(
                "WELCOME",
                DiscountType.PERCENT,
                10L,
                50_000L,
                0L,
                100,
                0,
                null,
                null,
                true));

        return new Data(
                oils,
                seeds,
                byproducts,
                fixedProduct,
                quoteProduct,
                bottleOneLiter,
                bottleHalfLiter,
                weighted,
                welcome);
    }

    public record Data(
            Category oils,
            Category seeds,
            Category byproducts,
            Product fixedProduct,
            Product quoteProduct,
            ProductVariant bottleOneLiter,
            ProductVariant bottleHalfLiter,
            ProductVariant weighted,
            Voucher welcome) {
    }
}
