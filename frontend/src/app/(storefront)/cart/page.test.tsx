import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/context/CartContext';
import CartPage from './page';

const fixedCart = {
  version: 1,
  saleType: 'FIXED_PRICE',
  items: [{
    productId: '1', productName: 'Dầu lạc', productSlug: 'dau-lac',
    variantId: '15', variantName: '1L', price: 90000, quantity: 1,
    minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
  }],
};

function mount() {
  return render(<CartProvider><CartPage /></CartProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify(fixedCart));
});
afterEach(() => vi.restoreAllMocks());

it('edits quantity, updates the estimate, and removes a cart line', async () => {
  mount();
  await screen.findByRole('heading', { name: 'Giỏ hàng' });
  fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Dầu lạc' }));

  expect(await screen.findByText('Tạm tính dòng hàng: 180.000 ₫')).toBeVisible();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(2));
  fireEvent.click(screen.getByRole('button', { name: 'Xóa Dầu lạc khỏi giỏ hàng' }));
  expect(await screen.findByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible();
});

it('shows a quote request without rendering null totals as zero VND', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
    version: 1,
    saleType: 'QUOTE',
    items: [{
      ...fixedCart.items[0], variantId: '9', variantName: '0.5kg', price: null,
      quantity: 0.5, minQuantity: 0.5, quantityStep: 0.5, saleType: 'QUOTE',
    }],
  }));
  mount();

  expect(await screen.findByText('Shop sẽ báo giá sau khi liên hệ')).toBeVisible();
  expect(screen.getByText('Sản phẩm báo giá chưa có giá cố định. Shop sẽ liên hệ để xác nhận quy cách và mức giá.')).toBeVisible();
  expect(screen.queryByText(/Tạm tính ước lượng/)).not.toBeInTheDocument();
  expect(screen.queryByText(/0\s*₫/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Gửi yêu cầu báo giá' })).toHaveAttribute('href', '/checkout');
});

it('keeps edits in memory and explains when local storage is unavailable', async () => {
  mount();
  await screen.findByRole('heading', { name: 'Giỏ hàng' });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });

  fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Dầu lạc' }));

  expect(await screen.findByRole('status')).toHaveTextContent(/bộ nhớ tạm/i);
  expect(screen.getByText('Tạm tính dòng hàng: 180.000 ₫')).toBeVisible();
});

it('keeps a partially typed decimal out of the cart until blur', async () => {
  const user = userEvent.setup();
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
    version: 1, saleType: 'QUOTE',
    items: [{ ...fixedCart.items[0], price: null, saleType: 'QUOTE', minQuantity: 0.5, quantityStep: 0.5 }],
  }));
  mount();
  const input = await screen.findByRole('spinbutton', { name: 'Số lượng Dầu lạc' });
  await user.clear(input);
  await user.type(input, '0');
  expect(input).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(1);
  await user.type(input, '.5');
  await user.tab();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(0.5));
});

it('commits a complete quantity on Enter and retains the cart for invalid drafts', async () => {
  const user = userEvent.setup();
  mount();
  const input = await screen.findByRole('spinbutton', { name: 'Số lượng Dầu lạc' });
  await user.clear(input);
  await user.type(input, '12{Enter}');
  await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(12));
  for (const value of ['0', '', '1.5']) {
    await user.clear(input);
    if (value) await user.type(input, value);
    await user.tab();
    expect(input).toHaveValue(12);
    expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(12);
    expect(screen.getByRole('alert')).toHaveTextContent(/số lượng/i);
  }
});
