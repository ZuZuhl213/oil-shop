import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';
import { toUiProduct } from '@/lib/catalog-adapter';
import { clearQuoteDraft, readQuoteDraft } from '@/lib/checkout-storage';
import { product } from '@/test/catalog-fixtures';
import { ProductCard } from './ProductCard';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); clearQuoteDraft(); push.mockReset(); });

function CartState() {
  const cart = useCart();
  return <div data-testid="cart-state">{JSON.stringify({ items: cart.items, open: cart.isCartOpen })}</div>;
}
function mount(value = product) {
  render(<CartProvider><ProductCard product={toUiProduct(value)} /><CartState /><button>Outside</button></CartProvider>);
  const available = value.status === 'ACTIVE' && value.variants.some(v => v.isActive && (value.saleType === 'QUOTE' || v.price != null));
  return screen.getByRole('button', { name: `${available ? 'Chọn mua' : 'Hết hàng'} ${value.name}` });
}
function cart() { return JSON.parse(screen.getByTestId('cart-state').textContent!); }

it('opens real available variants without adding until selection, then merges repeated additions', async () => {
  const trigger = mount({ ...product, variants: [...product.variants,
    { ...product.variants[0], id: '43', name: 'Inactive', isActive: false },
    { ...product.variants[0], id: '44', name: 'No price', price: null },
  ] });
  expect(trigger.closest('a')).toBeNull();
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(cart().items).toEqual([]);
  expect(screen.queryByRole('menuitem', { name: /Inactive|No price/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('menuitem', { name: /Can 5L.*400.000/ }));
  expect(cart()).toMatchObject({ open: false, items: [{ variantId: '42', quantity: 2, price: 400000 }] });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Đã thêm vào giỏ');
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('menuitem', { name: /Can 5L/ }));
  await waitFor(() => expect(cart().items).toHaveLength(1));
  expect(cart().items[0].quantity).toBe(4);
  expect(push).not.toHaveBeenCalled();
});

it('supports arrow keys, Escape, and outside dismissal with trigger focus restored', async () => {
  const trigger = mount();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  await waitFor(() => expect(screen.getByRole('menuitem', { name: /Chai 1L/ })).toHaveFocus());
  fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
  expect(screen.getByRole('menuitem', { name: /Can 5L/ })).toHaveFocus();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('button', { name: 'Outside' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('accepts a zero-price variant', () => {
  const trigger = mount({ ...product, variants: [{ ...product.variants[0], price: 0 }] });
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('menuitem', { name: /Chai 1L.*0 ₫/ }));
  expect(cart().items[0]).toMatchObject({ variantId: '41', price: 0 });
});

it('keeps quote selection out of the retail cart and uses the existing quote draft flow', () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'FIXED_PRICE', items: [{
    productId: '31', productName: 'Dầu lạc API', productSlug: 'dau-lac-api', variantId: '41', variantName: 'Chai 1L',
    price: 90000, quantity: 1, minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
  }] }));
  const quote = { ...product, saleType: 'QUOTE' as const, variants: [{ ...product.variants[1], price: null }] };
  const trigger = mount(quote);
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Can 5L' }));
  expect(cart().items).toHaveLength(1);
  expect(cart().items[0]).toMatchObject({ variantId: '41', quantity: 1, price: 90000 });
  expect(readQuoteDraft()).toMatchObject({ variantId: '42', quantity: 2 });
  expect(push).toHaveBeenCalledWith('/checkout?mode=quote');
});

it('retains the menu and reports cart rejection without claiming success', () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ version: 1, saleType: 'QUOTE', items: [{
    productId: '31', productName: 'Quote item', productSlug: 'quote-item', variantId: '99', variantName: 'Quote',
    price: null, quantity: 1, minQuantity: 1, quantityStep: 1, saleType: 'QUOTE', thumbnailType: 'peanut',
  }] }));
  fireEvent.click(mount());
  fireEvent.click(screen.getByRole('menuitem', { name: /Chai 1L/ }));
  expect(screen.getByRole('alert')).toHaveTextContent('Không thể trộn');
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.queryByText('Đã thêm vào giỏ')).not.toBeInTheDocument();
  expect(cart().items).toHaveLength(1);
  expect(cart().items[0].variantId).toBe('99');
});

it.each([ { ...product, variants: [] }, { ...product, status: 'INACTIVE' as const } ])('disables selection for an unavailable product', value => {
  expect(mount(value)).toBeDisabled();
});

it.each(['FIXED_PRICE', 'QUOTE'] as const)('shows out-of-stock contact instead of purchasing a %s product', saleType => {
  const button = mount({ ...product, saleType, variants: [] });
  expect(button).toHaveTextContent('Hết hàng');
  expect(button).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Liên hệ để biết thêm thông tin' })).toHaveAttribute('href', '/contact');
  expect(screen.queryByText('Sẵn sàng giao tận bếp')).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(cart().items).toEqual([]);
  expect(push).not.toHaveBeenCalled();
});
