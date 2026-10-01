import type { CategoryDto, ProductDto } from '@/lib/api/contracts/types';
import type { ExtendedProductDto } from '@/lib/mock-data';

export type VisualType = ExtendedProductDto['visualType'];

function normalizedText(input: { name?: string; slug?: string; categoryId?: string }): string {
  return [input.name, input.slug, input.categoryId].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN');
}

export function visualTypeFor(input: {
  name?: string;
  slug?: string;
  categoryId?: string;
}): VisualType {
  const text = normalizedText(input);
  if (/phụ phẩm|phu-pham|bã |ba-|byproduct/.test(text)) return 'byproduct';
  if (/sachi/.test(text)) return 'sachi';
  if (/mè|me |vừng|vung|sesame/.test(text)) return 'sesame';
  if (/gấc|gac/.test(text)) return 'gac';
  if (/dừa|dua|coconut/.test(text)) return 'coconut';
  if (/hạt|hat |seed|nguyên liệu|nguyen-lieu/.test(text)) return 'seeds';
  if (/lạc|lac|đậu phộng|dau-phong|peanut/.test(text)) return 'peanut';
  return 'peanut';
}

export function toUiProduct(
  product: ProductDto,
  category?: CategoryDto,
): ExtendedProductDto {
  return {
    ...product,
    visualType: visualTypeFor({
      name: product.name,
      slug: product.slug,
      categoryId: category?.name ?? product.categoryId,
    }),
    specs: [],
    featured: product.sortOrder < 3,
    categoryName: category?.name,
    categorySlug: category?.slug,
  };
}

export function toUiProducts(
  products: ProductDto[],
  categories: CategoryDto[] = [],
): ExtendedProductDto[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return products.map((product) => toUiProduct(product, byId.get(product.categoryId)));
}
