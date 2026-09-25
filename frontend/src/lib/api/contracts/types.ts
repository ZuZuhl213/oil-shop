/**
 * API Contract Types — mirrors backend Spring Boot DTOs exactly.
 *
 * All `id` fields are serialized as decimal strings (Long → string).
 * Money fields are nullable Long (VND, no decimals).
 * Timestamps are ISO-8601 strings from Instant.
 * BigDecimal quantities are serialized as strings.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type SaleType = 'FIXED_PRICE' | 'QUOTE';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type OrderType = 'ORDER' | 'QUOTE_REQUEST';
export type OrderStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type DiscountType = 'FIXED' | 'PERCENT';

// ─── Catalog ─────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface VariantDto {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number | null;
  minQuantity: string;
  quantityStep: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  saleType: SaleType;
  status: string;
  sortOrder: number;
  variants: VariantDto[];
}

export interface PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Orders ──────────────────────────────────────────────────────────

export interface ItemInput {
  variantId: string;
  quantity: string; // BigDecimal serialized as string
}

export interface CreateOrderRequest {
  orderType: OrderType;
  customerName: string;
  phone: string;
  address?: string;
  note?: string;
  voucherCode?: string;
  items: ItemInput[];
}

export interface OrderReceipt {
  orderCode: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number | null;
  discountAmount: number;
  totalAmount: number | null;
  createdAt: string; // ISO-8601
}

export interface CreateResult {
  receipt: OrderReceipt;
  replayed: boolean;
}

// ─── Voucher ─────────────────────────────────────────────────────────

export interface VoucherValidateRequest {
  code: string;
  items: ItemInput[];
}

export interface PricePreview {
  subtotal: number | null;
  discountAmount: number;
  totalAmount: number | null;
  voucherCode: string | null;
}

// ─── API Error ───────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  path: string;
}
