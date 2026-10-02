import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from '@/context/CartContext';
import { CartDrawer } from './CartDrawer';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';

vi.mock('next/navigation', () => ({ usePathname: () => '/cart' }));

let cart: ReturnType<typeof useCart>;
function Triggers() {
  const currentCart = useCart();
  React.useLayoutEffect(() => { cart = currentCart; });
  return <>
    <button onClick={currentCart.openCart}>Open cart</button>
    <button onClick={currentCart.openNav}>Open menu</button>
    <button>Background action</button>
  </>;
}
function mount() {
  return render(<StrictMode><CartProvider><Triggers /><CartDrawer /><MobileNavDrawer /></CartProvider></StrictMode>);
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  for (const element of [document.body, document.documentElement]) {
    for (const property of ['overflow', 'overflow-x', 'overflow-y']) element.style.removeProperty(property);
  }
});

it('focuses close on open, closes on Escape, and restores the trigger', async () => {
  const user = userEvent.setup();
  mount();
  const trigger = screen.getByRole('button', { name: 'Open cart' });
  await user.click(trigger);
  expect(screen.getByRole('button', { name: 'Đóng giỏ hàng' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('wraps Tab and Shift+Tab and keeps programmatic focus in the drawer', async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: 'Open cart' }));
  const close = screen.getByRole('button', { name: 'Đóng giỏ hàng' });
  const last = screen.getByRole('link', { name: 'Khám Phá Sản Phẩm' });
  await user.tab({ shift: true });
  expect(last).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();
  await user.tab();
  expect(last).toHaveFocus();
  screen.getByRole('button', { name: 'Background action' }).focus();
  expect(close).toHaveFocus();
});

it('skips disabled quantity controls while trapping focus in a populated drawer', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
    version: 1, saleType: 'FIXED_PRICE', items: [{
      productName: 'Dầu lạc', variantId: 'v1', variantName: '1L',
      price: 90000, quantity: 1, minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE',
    }],
  }));
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: 'Open cart' }));
  await user.tab();
  expect(screen.getByRole('button', { name: 'Xóa Dầu lạc' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Tăng' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Xóa Dầu lạc' })).toHaveFocus();
  const last = screen.getByRole('link', { name: /Tiếp tục đặt hàng/ });
  last.focus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Đóng giỏ hàng' })).toHaveFocus();
});

it('restores scroll styles and focus when the backdrop closes the drawer', async () => {
  document.body.style.setProperty('overflow', 'scroll', 'important');
  document.documentElement.style.overflow = 'auto';
  const user = userEvent.setup();
  const view = mount();
  const trigger = screen.getByRole('button', { name: 'Open cart' });
  await user.click(trigger);
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.documentElement.style.overflow).toBe('hidden');
  fireEvent.click(view.container.querySelector('.cart-drawer-backdrop')!);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe('scroll');
  expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
  expect(document.documentElement.style.overflow).toBe('auto');
});

it('cleans up focus listeners and scroll on unmount', async () => {
  const user = userEvent.setup();
  const external = document.createElement('button');
  document.body.append(external);
  const view = mount();
  await user.click(screen.getByRole('button', { name: 'Open cart' }));
  view.unmount();
  expect(document.body.style.overflow).toBe('');
  expect(document.documentElement.style.overflow).toBe('');
  external.focus();
  expect(external).toHaveFocus();
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  external.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  external.remove();
});

it('restores independently configured scroll axes and their priorities', async () => {
  document.body.style.setProperty('overflow-x', 'hidden', 'important');
  document.body.style.overflowY = 'scroll';
  document.documentElement.style.overflowY = 'auto';
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: 'Open cart' }));
  await user.keyboard('{Escape}');
  expect(document.body.style.overflowX).toBe('hidden');
  expect(document.body.style.getPropertyPriority('overflow-x')).toBe('important');
  expect(document.body.style.overflowY).toBe('scroll');
  expect(document.documentElement.style.overflowY).toBe('auto');
});

it('does not restore focus to a trigger that has been removed', async () => {
  const user = userEvent.setup();
  mount();
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  act(() => cart.openCart());
  const focus = vi.spyOn(trigger, 'focus');
  trigger.remove();
  await user.keyboard('{Escape}');
  expect(focus).not.toHaveBeenCalled();
});

it('hands focus and scroll ownership between cart and menu without two active dialogs', async () => {
  const user = userEvent.setup();
  mount();
  const trigger = screen.getByRole('button', { name: 'Open cart' });
  await user.click(trigger);
  act(() => cart.openNav());
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Menu điều hướng');
  expect(screen.getByRole('button', { name: 'Đóng menu' })).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');
  act(() => cart.openCart());
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Đóng giỏ hàng' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(document.body.style.overflow).toBe('');
  expect(trigger).toHaveFocus();
});

it('closes menu when adding an item opens cart, including rejected additions', async () => {
  const user = userEvent.setup();
  mount();
  const item = { productName: 'Oil', variantId: 'v1', variantName: '1L', price: 90000, minQuantity: 1, quantityStep: 1 };
  for (const price of [90000, null]) {
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    act(() => { cart.addItem({ ...item, price }); });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Giỏ hàng HM NATURALS');
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng giỏ hàng' })).toHaveFocus();
    await user.keyboard('{Escape}');
  }
});
