import type { CartItem, CartItemInput, CartState, CartThumbnailType } from './cart-types';
import { EMPTY_CART, getCartSubtotal, MAX_CART_LINES, normalizeCartItem } from './cart-store';

export const CART_STORAGE_KEY = 'hm_naturals_cart_v1';

type CartStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type CartStorageWarning = 'invalid' | 'unavailable' | null;

export interface ReadCartResult {
  state: CartState;
  warning: CartStorageWarning;
}

export interface WriteCartResult {
  ok: boolean;
  warning: CartStorageWarning;
}

const thumbnailTypes = new Set<CartThumbnailType>([
  'peanut', 'sesame', 'sachi', 'byproduct', 'gac', 'coconut', 'seeds',
]);

function getBrowserStorage(): CartStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function normalizeStoredCartItem(value: unknown, fallbackSaleType: CartState['saleType']): CartItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<CartItem>;
  const saleType = item.saleType ?? fallbackSaleType ?? (item.price === null ? 'QUOTE' : 'FIXED_PRICE');
  const min = item.minQuantity ?? 1;
  const step = item.quantityStep ?? 1;
  if (
    typeof item.variantId !== 'string' || !item.variantId.trim() ||
    typeof item.productName !== 'string' || !item.productName.trim() ||
    typeof item.variantName !== 'string' || !item.variantName.trim() ||
    !Number.isFinite(item.quantity) || !Number.isFinite(min) || !Number.isFinite(step) ||
    (item.productId !== undefined && typeof item.productId !== 'string') ||
    (item.productSlug !== undefined && typeof item.productSlug !== 'string') ||
    (item.thumbnailType !== undefined && !thumbnailTypes.has(item.thumbnailType))
  ) return null;

  return normalizeCartItem({
    ...item,
    minQuantity: min,
    quantityStep: step,
    saleType,
  } as CartItemInput);
}

export function parseCartState(value: unknown): CartState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const stored = value as { version?: unknown; saleType?: unknown; items?: unknown };
  if (stored.version !== 1 || !Array.isArray(stored.items) || stored.items.length > MAX_CART_LINES) return null;
  if (stored.saleType != null && stored.saleType !== 'FIXED_PRICE' && stored.saleType !== 'QUOTE') return null;
  if (stored.items.length === 0) return { ...EMPTY_CART };

  const initialType = stored.saleType === 'FIXED_PRICE' || stored.saleType === 'QUOTE'
    ? stored.saleType
    : null;
  const normalizedItems = stored.items.map((item) => normalizeStoredCartItem(item, initialType));
  if (normalizedItems.some((item) => item === null)) return null;
  const items = normalizedItems as CartItem[];
  const saleType = items[0].saleType;
  if (!saleType || items.some((item) => item.saleType !== saleType) || (initialType && saleType !== initialType)) return null;
  const variantIds = new Set(items.map((item) => item.variantId));
  if (variantIds.size !== items.length) return null;

  const state: CartState = { version: 1, saleType, items };
  return state.saleType === 'FIXED_PRICE' && getCartSubtotal(state) == null ? null : state;
}

export function readCart(storage?: CartStorage | null): ReadCartResult {
  const target = storage === undefined ? getBrowserStorage() : storage;
  if (target === null) {
    return {
      state: { ...EMPTY_CART },
      warning: typeof window === 'undefined' ? null : 'unavailable',
    };
  }

  let raw: string | null;
  try {
    raw = target.getItem(CART_STORAGE_KEY);
  } catch {
    return { state: { ...EMPTY_CART }, warning: 'unavailable' };
  }
  if (raw === null) return { state: { ...EMPTY_CART }, warning: null };
  const result = parseCartStorageValue(raw);
  if (result.warning !== 'invalid') return result;
  try { target.removeItem(CART_STORAGE_KEY); } catch { /* discard best effort */ }
  return result;
}

export function parseCartStorageValue(raw: string | null): ReadCartResult {
  if (raw === null) return { state: { ...EMPTY_CART }, warning: null };
  try {
    const state = parseCartState(JSON.parse(raw));
    return state
      ? { state, warning: null }
      : { state: { ...EMPTY_CART }, warning: 'invalid' };
  } catch {
    return { state: { ...EMPTY_CART }, warning: 'invalid' };
  }
}

export function writeCart(state: CartState, storage?: CartStorage | null): WriteCartResult {
  const target = storage === undefined ? getBrowserStorage() : storage;
  if (target === null) return { ok: false, warning: 'unavailable' };
  try {
    const serialized = JSON.stringify(state);
    if (target.getItem(CART_STORAGE_KEY) !== serialized) target.setItem(CART_STORAGE_KEY, serialized);
    return { ok: true, warning: null };
  } catch {
    return { ok: false, warning: 'unavailable' };
  }
}

export function cartStorageWarningMessage(warning: CartStorageWarning): string | null {
  if (warning === 'invalid') return 'Dữ liệu giỏ hàng cũ không hợp lệ đã được xóa. Bạn có thể thêm lại sản phẩm.';
  if (warning === 'unavailable') return 'Không lưu được giỏ hàng trên thiết bị này. Sản phẩm hiện được giữ trong bộ nhớ tạm của trang.';
  return null;
}
