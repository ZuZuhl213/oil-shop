import { apiFetch } from "./api-client";
import type { Category, Product, Page } from "./api-types";

export interface ProductQuery {
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
}

export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function getProducts(query: ProductQuery = {}): Promise<Page<Product>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 12));
  if (query.category) params.set("category", query.category);
  if (query.keyword) params.set("keyword", query.keyword);
  return apiFetch<Page<Product>>(`/products?${params.toString()}`);
}

export function getProduct(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}
