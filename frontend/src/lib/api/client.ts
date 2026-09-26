/**
 * Same-origin HTTP client for the Spring Boot API.
 *
 * The browser only talks to /api/v1. Next.js forwards those requests to the
 * server-only BACKEND_API_ORIGIN so backend credentials and topology stay out
 * of the client bundle.
 */

import type {
  ApiError,
  CreateOrderRequest,
  CsrfResponse,
  CategoryDto,
  ItemInput,
  OrderReceipt,
  PageDto,
  PricePreview,
  ProductDto,
  VoucherValidateRequest,
} from './contracts/types';

const API_PREFIX = '/api/v1';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;
  readonly traceId?: string;

  constructor(status: number, error: Partial<ApiError>, cause?: unknown) {
    super(error.message ?? 'Request failed', { cause });
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code ?? 'REQUEST_FAILED';
    this.fieldErrors = error.fieldErrors ?? {};
    this.traceId = error.traceId;
  }
}

function sameOriginPath(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
    throw new Error('apiFetch only accepts same-origin paths');
  }
  if (path === API_PREFIX || path.startsWith(API_PREFIX + '/')) {
    return path;
  }
  return API_PREFIX + (path.startsWith('/') ? path : '/' + path);
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', headers.get('Accept') ?? 'application/json');

  let body = init.body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    body = JSON.stringify(body);
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  }

  const requestPath = sameOriginPath(path);
  let response: Response;
  try {
    response = await fetch(requestPath, {
      ...init,
      body,
      headers,
      cache: init.cache ?? 'no-store',
      credentials: init.credentials ?? 'include',
    });
  } catch (cause) {
    throw new ApiClientError(
      503,
      {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable',
        fieldErrors: {},
      },
      cause,
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = await readJson(response);
  if (!response.ok) {
    const error = (payload && typeof payload === 'object' ? payload : {}) as Partial<ApiError>;
    throw new ApiClientError(response.status, {
      code: error.code ?? 'REQUEST_FAILED',
      message: error.message ?? 'Request failed with status ' + response.status,
      fieldErrors: error.fieldErrors ?? {},
      traceId: error.traceId,
    });
  }
  return payload as T;
}

export function getCsrf(): Promise<CsrfResponse> {
  return apiFetch<CsrfResponse>('/csrf');
}

async function mutationHeaders(extra: HeadersInit = {}): Promise<Headers> {
  const csrf = await getCsrf();
  const headers = new Headers(extra);
  headers.set(csrf.headerName, csrf.token);
  return headers;
}

// ─── Public Catalog API ──────────────────────────────────────────────

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/categories');
}

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

// ─── Voucher API ─────────────────────────────────────────────────────

export async function validateVoucher(body: VoucherValidateRequest): Promise<PricePreview> {
  return apiFetch<PricePreview>('/vouchers/validate', {
    method: 'POST',
    headers: await mutationHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}

// ─── Order API ───────────────────────────────────────────────────────

export async function createOrder(
  body: CreateOrderRequest,
  idempotencyKey: string,
): Promise<OrderReceipt> {
  return apiFetch<OrderReceipt>('/orders', {
    method: 'POST',
    headers: await mutationHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    }),
    body: JSON.stringify(body),
  });
}

export type { ItemInput };
