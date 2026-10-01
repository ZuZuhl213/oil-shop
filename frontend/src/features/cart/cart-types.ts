import type { SaleType } from '@/lib/api/contracts/types';

export type CartSaleType = SaleType;
export type CartThumbnailType = 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';

export interface CartItem {
  variantId: string;
  quantity: number;
  minQuantity: number;
  quantityStep: number;
  productName: string;
  variantName: string;
  price: number | null;
  saleType?: CartSaleType;
  productId?: string;
  productSlug?: string;
  thumbnailType?: CartThumbnailType;
}

export interface CartState {
  version: 1;
  saleType: CartSaleType | null;
  items: CartItem[];
}

export type CartItemInput = Omit<CartItem, 'quantity'> & { quantity?: number; saleType?: CartSaleType };

export type CartAction =
  | { type: 'hydrate'; state: CartState }
  | { type: 'add'; item: CartItemInput }
  | { type: 'changeVariant'; variantId: string; item: CartItemInput }
  | { type: 'setQuantity'; variantId: string; quantity: number }
  | { type: 'remove'; variantId: string }
  | { type: 'clear' };

export type CartActionErrorCode =
  | 'MIXED_SALE_TYPES'
  | 'CART_LIMIT'
  | 'INVALID_QUANTITY'
  | 'INVALID_ITEM'
  | 'TOTAL_TOO_LARGE'
  | 'DUPLICATE_VARIANT';

export interface CartActionError {
  code: CartActionErrorCode;
  message: string;
}

export type CartTransition =
  | { state: CartState; error: null }
  | { state: CartState; error: CartActionError };

export type CartActionResult = { ok: true } | { ok: false; error: CartActionError };
