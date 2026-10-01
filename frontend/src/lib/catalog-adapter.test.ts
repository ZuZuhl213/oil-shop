import { describe, expect, it } from 'vitest';
import { toUiProduct, visualTypeFor } from './catalog-adapter';

describe('catalog adapter', () => {
  it('keeps backend quantities numeric and preserves the UI visual model', () => {
    const product = toUiProduct(
      {
        id: '15',
        categoryId: '2',
        name: 'Dầu Mè Đen',
        slug: 'dau-me-den',
        shortDescription: 'Mè đen ép chậm',
        description: null,
        thumbnailUrl: null,
        saleType: 'FIXED_PRICE',
        status: 'ACTIVE',
        sortOrder: 1,
        variants: [
          {
            id: '22',
            productId: '15',
            name: '0.5kg',
            sku: null,
            price: 120000,
            minQuantity: 0.5,
            quantityStep: 0.5,
            isActive: true,
            sortOrder: 0,
          },
        ],
      },
      { id: '2', name: 'Hạt giống & Nguyên liệu', slug: 'hat-nguyen-lieu', description: null, sortOrder: 1, isActive: true },
    );

    expect(product.visualType).toBe('sesame');
    expect(product.categorySlug).toBe('hat-nguyen-lieu');
    expect(product.variants[0]).toMatchObject({ minQuantity: 0.5, quantityStep: 0.5 });
    expect(product.specs).toEqual([]);
  });

  it('falls back to a deterministic image placeholder type', () => {
    expect(visualTypeFor({ name: 'Bã lạc khô', slug: 'ba-lac', categoryId: '3' })).toBe('byproduct');
    expect(visualTypeFor({ name: 'Sản phẩm mới', slug: 'san-pham-moi', categoryId: 'unknown' })).toBe('peanut');
  });
});
