import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateOrderRequest } from './api/contracts/types';
import {
  clearPendingOrder,
  clearQuoteDraft,
  readPendingOrder,
  readQuoteDraft,
  rememberReceipt,
  readReceipt,
  savePendingOrder,
  saveQuoteDraft,
  type QuoteDraft,
} from './checkout-storage';

function storageMock(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } as Storage;
}

const payload: CreateOrderRequest = {
  orderType: 'ORDER',
  customerName: 'Nguyen Van A',
  phone: '0912345678',
  items: [{ variantId: '15', quantity: 1 }],
};

const quote: QuoteDraft = {
  productId: '3',
  productName: 'Dầu Sachi',
  productSlug: 'dau-sachi',
  variantId: '9',
  variantName: '0.5kg',
  quantity: 0.5,
  minQuantity: 0.5,
  quantityStep: 0.5,
  thumbnailType: 'sachi',
};

describe('checkout storage', () => {
  beforeEach(() => {
    clearPendingOrder(storageMock());
    clearQuoteDraft(storageMock());
  });

  it('round-trips the pending key and exact payload', () => {
    const storage = storageMock();
    expect(savePendingOrder(storage, { key: 'key-1', payload })).toBe(true);
    expect(readPendingOrder(storage)).toEqual({ key: 'key-1', payload });
    clearPendingOrder(storage);
    expect(readPendingOrder(storage)).toBeNull();
  });

  it('rejects malformed pending data instead of submitting it', () => {
    const storage = storageMock();
    storage.setItem('hm_pending_order_v1', JSON.stringify({ key: 'key-1', payload: { ...payload, items: [] } }));
    expect(readPendingOrder(storage)).toBeNull();
  });

  it('keeps a quote draft in memory when session storage is unavailable', () => {
    const unavailable = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    expect(saveQuoteDraft(unavailable, quote)).toBe(false);
    expect(readQuoteDraft(unavailable)).toEqual(quote);
    clearQuoteDraft(unavailable);
    expect(readQuoteDraft(unavailable)).toBeNull();
  });

  it('keeps the newest in-memory quote when persistence fails over a stale stored draft', () => {
    const values = new Map<string, string>();
    let writesBlocked = false;
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (writesBlocked) throw new Error('quota');
        values.set(key, value);
      },
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage;
    const newerQuote = { ...quote, variantId: '10', productName: 'Dầu mới' };

    expect(saveQuoteDraft(storage, quote)).toBe(true);
    writesBlocked = true;
    expect(saveQuoteDraft(storage, newerQuote)).toBe(false);

    expect(readQuoteDraft(storage)).toEqual(newerQuote);
  });

  it('keeps the newest in-memory pending order when persistence fails over a stale attempt', () => {
    const values = new Map<string, string>();
    let writesBlocked = false;
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (writesBlocked) throw new Error('quota');
        values.set(key, value);
      },
      removeItem: (key: string) => values.delete(key),
    } as unknown as Storage;
    const first = { key: 'key-1', payload };
    const newer = { key: 'key-2', payload: { ...payload, customerName: 'Khách mới' } };

    expect(savePendingOrder(storage, first)).toBe(true);
    writesBlocked = true;
    expect(savePendingOrder(storage, newer)).toBe(false);

    expect(readPendingOrder(storage)).toEqual(newer);
  });

  it('keeps a successful receipt in memory when session storage is unavailable', () => {
    const unavailable = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    const receipt = { orderCode: 'DH-1', orderType: 'ORDER' as const };
    rememberReceipt(receipt.orderCode, receipt);
    expect(readReceipt(unavailable, receipt.orderCode)).toEqual(receipt);
  });
});
