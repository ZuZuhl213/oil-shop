/**
 * Frontend types for the public Spring Boot API.
 *
 * Long identifiers are serialized as strings and BigDecimal quantities as JSON
 * numbers by the backend contract. Money values are VND integers.
 */

export type SaleType = 'FIXED_PRICE' | 'QUOTE';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type OrderType = 'ORDER' | 'QUOTE_REQUEST';
export type OrderStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type DiscountType = 'FIXED' | 'PERCENT';
export type FieldErrors = Record<string, string>;

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
  minQuantity: number;
  quantityStep: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductImageDto {
  id: string;
  url: string;
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
  images: ProductImageDto[];
  imagesRevision: number;
  saleType: SaleType;
  status: ProductStatus;
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

export interface ItemInput {
  variantId: string;
  quantity: number;
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
  createdAt: string;
}

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

export interface CsrfResponse {
  token: string;
  headerName: string;
}

export interface ApiError {
  code: string;
  message: string;
  fieldErrors: FieldErrors;
  traceId?: string;
}
