export type FieldErrors = Record<string, string>;

export interface ApiError {
  code: string;
  message: string;
  fieldErrors: FieldErrors;
  traceId: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type SaleType = "FIXED_PRICE" | "QUOTE";

export interface Variant {
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

export interface Product {
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
  variants: Variant[];
}

export interface CsrfResponse {
  token: string;
  headerName: string;
}
