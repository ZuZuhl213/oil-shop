/**
 * Thin HTTP client for the Spring Boot API.
 *
 * All functions target /api/v1/* and return typed responses.
 * In dev mode, falls back to mock data when NEXT_PUBLIC_API_BASE is not set.
 */

import type {
  CategoryDto,
  ProductDto,
  PageDto,
  CreateOrderRequest,
  CreateResult,
  VoucherValidateRequest,
  PricePreview,
  ApiError,
} from './contracts/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

class ApiClientError extends Error {
  constructor(
    public status: number,
    public body: ApiError | null,
  ) {
    super(body?.message ?? `API error ${status}`);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = await res.json();
    } catch {
      // response body was not JSON
    }
    throw new ApiClientError(res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ─── Public Catalog API ──────────────────────────────────────────────

export async function getCategories(): Promise<CategoryDto[]> {
  return request<CategoryDto[]>('/api/v1/categories');
}

export async function getProducts(params?: {
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
}): Promise<PageDto<ProductDto>> {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.size !== undefined) searchParams.set('size', String(params.size));
  if (params?.category) searchParams.set('category', params.category);
  if (params?.keyword) searchParams.set('keyword', params.keyword);

  const query = searchParams.toString();
  return request<PageDto<ProductDto>>(`/api/v1/products${query ? `?${query}` : ''}`);
}

export async function getProductBySlug(slug: string): Promise<ProductDto> {
  return request<ProductDto>(`/api/v1/products/${encodeURIComponent(slug)}`);
}

// ─── Voucher API ─────────────────────────────────────────────────────

export async function validateVoucher(
  body: VoucherValidateRequest,
): Promise<PricePreview> {
  return request<PricePreview>('/api/v1/vouchers/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Order API ───────────────────────────────────────────────────────

export async function createOrder(
  body: CreateOrderRequest,
): Promise<CreateResult> {
  return request<CreateResult>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export { ApiClientError };
