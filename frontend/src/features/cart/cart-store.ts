import type {
  CartAction,
  CartActionError,
  CartActionResult,
  CartItem,
  CartItemInput,
  CartState,
  CartTransition,
} from './cart-types';

export const MAX_CART_LINES = 50;
export const MAX_MONEY_VND = 9_000_000_000_000;

export const EMPTY_CART: CartState = {
  version: 1,
  saleType: null,
  items: [],
};

const errors = {
  mixed: {
    code: 'MIXED_SALE_TYPES',
    message: 'Không thể trộn sản phẩm đặt hàng và sản phẩm báo giá trong cùng giỏ. Hãy hoàn tất hoặc xóa giỏ hiện tại trước.',
  },
  limit: {
    code: 'CART_LIMIT',
    message: 'Giỏ hàng tối đa 50 dòng sản phẩm. Hãy xóa bớt sản phẩm trước khi thêm.',
  },
  quantity: {
    code: 'INVALID_QUANTITY',
    message: 'Số lượng không đúng với quy cách tối thiểu và bước tăng của sản phẩm.',
  },
  item: {
    code: 'INVALID_ITEM',
    message: 'Thông tin sản phẩm không hợp lệ. Hãy tải lại trang sản phẩm rồi thử lại.',
  },
  total: {
    code: 'TOTAL_TOO_LARGE',
    message: 'Tạm tính vượt giới hạn. Hãy giảm số lượng hoặc liên hệ cửa hàng.',
  },
  duplicate: {
    code: 'DUPLICATE_VARIANT',
    message: 'Quy cách này đã có trong giỏ hàng.',
  },
} satisfies Record<string, CartActionError>;

function toCents(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > 99_999_999.99) return null;
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 0.000001 ? cents : null;
}

export function isQuantityValid(quantity: number, minQuantity: number, quantityStep: number): boolean {
  const quantityCents = toCents(quantity);
  const minimumCents = toCents(minQuantity);
  const stepCents = toCents(quantityStep);
  if (quantityCents == null || minimumCents == null || stepCents == null || stepCents < 1) return false;
  return quantityCents >= minimumCents && (quantityCents - minimumCents) % stepCents === 0;
}

function getSaleType(item: CartItemInput): 'FIXED_PRICE' | 'QUOTE' | null {
  if (item.saleType === 'FIXED_PRICE' || item.saleType === 'QUOTE') return item.saleType;
  if (item.saleType) return null;
  if (item.price === null) return 'QUOTE';
  return typeof item.price === 'number' ? 'FIXED_PRICE' : null;
}

export function normalizeCartItem(item: CartItemInput): CartItem | null {
  if (!item || typeof item !== 'object') return null;
  const saleType = getSaleType(item);
  const minCents = toCents(item.minQuantity);
  const stepCents = toCents(item.quantityStep);
  const quantity = item.quantity ?? item.minQuantity;
  if (
    !item || typeof item !== 'object' || !saleType ||
    typeof item.variantId !== 'string' || item.variantId.trim() === '' ||
    typeof item.productName !== 'string' || item.productName.trim() === '' ||
    typeof item.variantName !== 'string' || item.variantName.trim() === '' ||
    minCents == null || minCents < 1 || stepCents == null || stepCents < 1 ||
    !isQuantityValid(quantity, item.minQuantity, item.quantityStep)
  ) return null;

  if (saleType === 'QUOTE' ? item.price !== null :
    typeof item.price !== 'number' || !Number.isSafeInteger(item.price) || item.price < 0) return null;

  const normalized = { ...item, quantity: Math.round(quantity * 100) / 100, saleType };
  return hasSafeLineTotal(normalized) ? normalized : null;
}

function lineTotal(item: CartItem): number | null {
  if (item.saleType === 'QUOTE' || item.price === null) return null;
  const quantityCents = toCents(item.quantity);
  if (quantityCents == null) return null;
  const centsProduct = item.price * quantityCents;
  if (!Number.isSafeInteger(centsProduct) || centsProduct % 100 !== 0) return null;
  const total = centsProduct / 100;
  return total <= MAX_MONEY_VND ? total : null;
}

function hasSafeLineTotal(item: CartItem): boolean {
  return item.saleType === 'QUOTE' || lineTotal(item) !== null;
}

export function cartMatchesItems(
  state: CartState,
  items: ReadonlyArray<Pick<CartItem, 'variantId' | 'quantity'>>,
): boolean {
  if (state.items.length !== items.length) return false;
  return state.items.every((cartItem) => {
    const submitted = items.find((item) => item.variantId === cartItem.variantId);
    return submitted !== undefined && toCents(submitted.quantity) === toCents(cartItem.quantity);
  });
}

export function getCartSubtotal(state: CartState): number | null {
  if (state.saleType !== 'FIXED_PRICE') return null;
  let subtotal = 0;
  for (const item of state.items) {
    const total = lineTotal(item);
    if (total == null || subtotal > MAX_MONEY_VND - total) return null;
    subtotal += total;
  }
  return subtotal;
}

function finish(items: CartItem[]): CartState {
  return {
    version: 1,
    saleType: items[0]?.saleType ?? null,
    items,
  };
}

function failed(state: CartState, error: CartActionError): CartTransition {
  return { state, error };
}

function addedQuantity(existing: CartItem, added: CartItem): number {
  const stepCents = toCents(added.quantityStep) ?? 0;
  const existingCents = toCents(existing.quantity);
  const addedCents = toCents(added.quantity);
  const minCents = toCents(added.minQuantity);
  if (existingCents == null || addedCents == null || minCents == null || stepCents < 1) return Number.NaN;
  const targetCents = existingCents + addedCents;
  const remainder = (targetCents - minCents) % stepCents;
  if (remainder === 0) return targetCents / 100;
  return (targetCents + stepCents - remainder) / 100;
}

export function applyCartAction(state: CartState, action: CartAction): CartTransition {
  if (action.type === 'hydrate') return { state: action.state, error: null };
  if (action.type === 'clear') return { state: EMPTY_CART, error: null };
  if (action.type === 'remove') {
    return { state: finish(state.items.filter((item) => item.variantId !== action.variantId)), error: null };
  }
  if (action.type === 'setQuantity') {
    if (action.quantity === 0) {
      return { state: finish(state.items.filter((item) => item.variantId !== action.variantId)), error: null };
    }
    const existing = state.items.find((item) => item.variantId === action.variantId);
    if (!existing || !isQuantityValid(action.quantity, existing.minQuantity, existing.quantityStep)) {
      return failed(state, errors.quantity);
    }
    const quantity = Math.round(action.quantity * 100) / 100;
    const updated = state.items.map((item) => item.variantId === action.variantId
      ? { ...item, quantity }
      : item);
    const nextState = finish(updated);
    if (getCartSubtotal(nextState) == null && nextState.saleType === 'FIXED_PRICE') {
      return failed(state, errors.total);
    }
    return { state: nextState, error: null };
  }

  if (action.type === 'changeVariant') {
    const existing = state.items.find((item) => item.variantId === action.variantId);
    const replacement = normalizeCartItem(action.item);
    if (!existing || !replacement || existing.saleType !== replacement.saleType ||
      (existing.productId && replacement.productId && existing.productId !== replacement.productId)) {
      return failed(state, errors.item);
    }
    if (replacement.variantId !== action.variantId && state.items.some((item) => item.variantId === replacement.variantId)) {
      return failed(state, errors.duplicate);
    }
    const quantity = isQuantityValid(existing.quantity, replacement.minQuantity, replacement.quantityStep)
      ? existing.quantity
      : replacement.minQuantity;
    const nextItems = state.items.map((item) => item.variantId === action.variantId
      ? { ...replacement, quantity }
      : item);
    const nextState = finish(nextItems);
    if (nextState.saleType === 'FIXED_PRICE' && getCartSubtotal(nextState) == null) return failed(state, errors.total);
    return { state: nextState, error: null };
  }

  const added = normalizeCartItem(action.item);
  if (!added) {
    const invalidQuantity = !isQuantityValid(action.item.quantity ?? action.item.minQuantity, action.item.minQuantity, action.item.quantityStep);
    return failed(state, invalidQuantity ? errors.quantity : errors.item);
  }
  if (state.saleType && state.saleType !== added.saleType) return failed(state, errors.mixed);

  const index = state.items.findIndex((item) => item.variantId === added.variantId);
  if (index < 0 && state.items.length >= MAX_CART_LINES) return failed(state, errors.limit);

  const nextItems = [...state.items];
  if (index < 0) {
    nextItems.push(added);
  } else {
    const oldItem = state.items[index];
    const quantity = addedQuantity(oldItem, added);
    if (!isQuantityValid(quantity, added.minQuantity, added.quantityStep)) return failed(state, errors.quantity);
    nextItems[index] = { ...oldItem, ...added, quantity };
  }

  const nextState = finish(nextItems);
  if (getCartSubtotal(nextState) == null && nextState.saleType === 'FIXED_PRICE') {
    return failed(state, errors.total);
  }
  return { state: nextState, error: null };
}

export function resultForTransition(transition: CartTransition): CartActionResult {
  return transition.error ? { ok: false, error: transition.error } : { ok: true };
}
