import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart, type CartItem } from '@/context/CartContext';
import { parseCartState } from './cart-storage';
import { applyCartAction, EMPTY_CART } from './cart-store';
import { CartDrawer } from '@/components/cart/CartDrawer';

const fixed = (variantId: string, quantity = 1): CartItem => ({
  productId: '1', productName: 'Dầu lạc', productSlug: 'dau-lac',
  variantId, variantName: '500ml', price: 90000, quantity,
  minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
});

const halfStep: CartItem = {
  ...fixed('half', 0.5), variantName: '0.5kg', price: null,
  minQuantity: 0.5, quantityStep: 0.5, saleType: 'QUOTE',
};

function CartHarness() {
  const cart = useCart();
  return React.createElement('div', null,
    React.createElement('output', { 'data-testid': 'items' }, JSON.stringify(cart.items)),
    React.createElement('output', { 'data-testid': 'storage' }, cart.storageMessage ?? ''),
    React.createElement('output', { 'data-testid': 'action' }, cart.actionError?.message ?? ''),
    React.createElement('button', { onClick: cart.openCart }, 'Open cart'),
    React.createElement('button', { onClick: () => cart.addItem(fixed('first')) }, 'Add fixed'),
    React.createElement('button', { onClick: () => cart.addItem(halfStep) }, 'Add quote'),
    React.createElement('button', { onClick: () => cart.updateQuantity('half', 0.75) }, 'Set invalid quantity'),
    React.createElement('button', { onClick: () => cart.updateQuantity('first', 1.5) }, 'Set invalid fixed quantity'),
    React.createElement('button', { onClick: () => cart.addItem(fixed('first', 1)) }, 'Add same variant'),
    React.createElement('button', { onClick: () => {
      for (let index = 0; index < 51; index++) cart.addItem(fixed('variant-' + index));
    } }, 'Add 51 variants'),
  );
}

function mountCart() {
  return render(React.createElement(CartProvider, null, React.createElement(CartHarness)));
}

describe('cart state', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('merges repeated additions and preserves valid decimal step quantities', () => {
    localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
      version: 1, saleType: 'QUOTE', items: [halfStep],
    }));
    mountCart();

    fireEvent.click(screen.getByRole('button', { name: 'Add quote' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add quote' }));

    expect(JSON.parse(screen.getByTestId('items').textContent ?? '[]')[0].quantity).toBe(1.5);
  });

  it('serializes merged decimal quantities with at most two decimal places', () => {
    const tenthStep: CartItem = {
      ...fixed('tenth', 0.1), variantName: '100g', price: null,
      minQuantity: 0.1, quantityStep: 0.1, saleType: 'QUOTE',
    };
    const first = applyCartAction(EMPTY_CART, { type: 'add', item: tenthStep });
    const second = applyCartAction(first.state, { type: 'add', item: { ...tenthStep, quantity: 0.2 } });

    expect(second.state.items[0].quantity).toBe(0.3);
  });

  it('persists canonical decimal quantities after incrementing and decrementing in the drawer', async () => {
    const tenthStep = {
      ...halfStep, quantity: 0.2, minQuantity: 0.1, quantityStep: 0.1,
    };
    localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
      version: 1, saleType: 'QUOTE', items: [tenthStep],
    }));
    render(React.createElement(CartProvider, null,
      React.createElement(CartHarness), React.createElement(CartDrawer)));
    fireEvent.click(screen.getByRole('button', { name: 'Open cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tăng' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(0.3));
    fireEvent.click(screen.getByRole('button', { name: 'Giảm' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(0.2));
  });

  it('rejects fractional quantities for a one-by-one variant', () => {
    mountCart();
    fireEvent.click(screen.getByRole('button', { name: 'Add fixed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set invalid fixed quantity' }));

    expect(screen.getByTestId('items')).toHaveTextContent('"quantity":1');
    expect(screen.getByTestId('action')).toHaveTextContent(/số lượng/i);
  });

  it('restores a saved cart after the provider mounts again', async () => {
    const firstMount = mountCart();
    fireEvent.click(screen.getByRole('button', { name: 'Add fixed' }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toHaveLength(1));
    firstMount.unmount();

    mountCart();

    expect(screen.getByTestId('items')).toHaveTextContent('"variantId":"first"');
  });

  it('rejects a quantity that does not match the variant minimum and step', () => {
    localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
      version: 1, saleType: 'QUOTE', items: [halfStep],
    }));
    mountCart();

    fireEvent.click(screen.getByRole('button', { name: 'Set invalid quantity' }));

    expect(screen.getByTestId('items')).toHaveTextContent('"quantity":0.5');
    expect(screen.getByTestId('action')).toHaveTextContent(/số lượng/i);
  });

  it('rejects a mixed sale type without mutating the existing cart', () => {
    mountCart();
    fireEvent.click(screen.getByRole('button', { name: 'Add fixed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add quote' }));

    expect(screen.getByTestId('items')).toHaveTextContent('"variantId":"first"');
    expect(screen.getByTestId('items')).not.toHaveTextContent('"variantId":"half"');
    expect(screen.getByTestId('action')).toHaveTextContent(/không thể.*cùng giỏ/i);
  });

  it('changes a cart line to another variant and resets quantity to its minimum when needed', () => {
    const current = applyCartAction(EMPTY_CART, { type: 'add', item: fixed('old', 3) }).state;
    const next = applyCartAction(current, {
      type: 'changeVariant', variantId: 'old',
      item: { ...fixed('new', 2), variantName: '2L', minQuantity: 2, quantityStep: 2, price: 150000 },
    });

    expect(next.error).toBeNull();
    expect(next.state.items).toHaveLength(1);
    expect(next.state.items[0]).toMatchObject({ variantId: 'new', variantName: '2L', quantity: 2, price: 150000 });
  });

  it('keeps valid quantities while updating all target variant fields', () => {
    for (const quantity of [4, 4.5]) {
      const source = { ...fixed('old', quantity), minQuantity: 0.5, quantityStep: 0.5 };
      const state = applyCartAction(EMPTY_CART, { type: 'add', item: source }).state;
      const next = applyCartAction(state, {
        type: 'changeVariant', variantId: 'old',
        item: { ...fixed('new', 0.5), variantName: 'Can', price: 400000, minQuantity: 0.5, quantityStep: 0.5 },
      });
      expect(next.error).toBeNull();
      expect(next.state.items[0]).toMatchObject({ variantId: 'new', variantName: 'Can', price: 400000, minQuantity: 0.5, quantityStep: 0.5, quantity });
    }
  });

  it('rejects a duplicate variant without changing either line', () => {
    const state = applyCartAction(applyCartAction(EMPTY_CART, { type: 'add', item: fixed('old', 3) }).state,
      { type: 'add', item: fixed('new', 2) }).state;
    const next = applyCartAction(state, { type: 'changeVariant', variantId: 'old', item: fixed('new') });
    expect(next.error?.code).toBe('DUPLICATE_VARIANT');
    expect(next.state).toBe(state);
    expect(next.state.items.map((item) => item.quantity)).toEqual([3, 2]);
  });

  it('preserves the cart when changing to invalid metadata or a different sale type', () => {
    const state = applyCartAction(EMPTY_CART, { type: 'add', item: fixed('old', 3) }).state;
    for (const item of [fixed('new', 0.5), halfStep, { ...fixed('new'), price: -1 }]) {
      const next = applyCartAction(state, { type: 'changeVariant', variantId: 'old', item });
      expect(next.error?.code).toBe('INVALID_ITEM');
      expect(next.state).toBe(state);
    }
  });

  it('limits the cart to 50 distinct variants', () => {
    mountCart();
    fireEvent.click(screen.getByRole('button', { name: 'Add 51 variants' }));

    const items = JSON.parse(screen.getByTestId('items').textContent ?? '[]');
    expect(items).toHaveLength(50);
    expect(screen.getByTestId('action')).toHaveTextContent(/tối đa 50 dòng/i);
  });

  it('keeps an invalid stored cart from crashing and reports the discarded data', () => {
    localStorage.setItem('hm_naturals_cart_v1', '{broken');
    mountCart();

    expect(screen.getByTestId('storage')).toHaveTextContent(/giỏ hàng cũ.*không hợp lệ/i);
    expect(localStorage.getItem('hm_naturals_cart_v1')).toBeNull();
  });

  it('rejects stored items that violate the same minimum and cart total rules as add', () => {
    expect(parseCartState({
      version: 1,
      saleType: 'FIXED_PRICE',
      items: [{ ...fixed('invalid', 0), minQuantity: 0, quantityStep: 1 }],
    })).toBeNull();

    expect(parseCartState({
      version: 1,
      saleType: 'FIXED_PRICE',
      items: [
        { ...fixed('large-a'), price: 9_000_000_000_000 },
        { ...fixed('large-b'), price: 9_000_000_000_000 },
      ],
    })).toBeNull();
  });

  it('keeps cart actions in memory when local storage writes fail', () => {
    mountCart();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });

    fireEvent.click(screen.getByRole('button', { name: 'Add fixed' }));

    expect(screen.getByTestId('items')).toHaveTextContent('"variantId":"first"');
    expect(screen.getByTestId('storage')).toHaveTextContent(/bộ nhớ tạm/i);
    vi.restoreAllMocks();
  });

  it('applies other-tab updates without writing them back repeatedly', () => {
    mountCart();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const crossTabValue = JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [fixed('remote')] });

    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: 'hm_naturals_cart_v1', newValue: crossTabValue,
    })));

    expect(screen.getByTestId('items')).toHaveTextContent('"variantId":"remote"');
    expect(setItem).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
