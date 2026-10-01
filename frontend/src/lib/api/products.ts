import { apiFetch } from './client';
import type { PageDto, ProductDto } from './contracts/types';

export function getProducts(params: {
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
} = {}): Promise<PageDto<ProductDto>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 12));
  if (params.category) searchParams.set('category', params.category);
  if (params.keyword) searchParams.set('keyword', params.keyword);
  return apiFetch<PageDto<ProductDto>>('/products?' + searchParams.toString());
}

export function getProductBySlug(slug: string): Promise<ProductDto> {
  return apiFetch<ProductDto>('/products/' + encodeURIComponent(slug));
}
