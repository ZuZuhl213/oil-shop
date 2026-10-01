import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/context/CartContext';
import CartPage from './page';
import { product } from '@/test/catalog-fixtures';

const fixedCart = {
  version: 1,
  saleType: 'FIXED_PRICE',
  items: [{
    productId: '1', productName: 'Dầu lạc', productSlug: 'dau-lac',
    variantId: '15', variantName: '1L', price: 90000, quantity: 1,
    minQuantity: 1, quantityStep: 1, saleType: 'FIXED_PRICE', thumbnailType: 'peanut',
  }],
};

const cartCatalog = {
  ...product, id: '1', slug: 'dau-lac',
  variants: product.variants.map((variant, index) => ({ ...variant, productId: '1', id: index === 0 ? '15' : variant.id })),
};

function mount() {
  return render(<CartProvider><CartPage /></CartProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify(fixedCart));
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(cartCatalog)));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('edits quantity, updates the estimate, and removes a cart line', async () => {
  mount();
  await screen.findByRole('heading', { name: 'Giỏ hàng' });
  fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Dầu lạc' }));

  expect(await screen.findByText('Tạm tính dòng hàng: 180.000 ₫')).toBeVisible();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(2));
  fireEvent.click(screen.getByRole('button', { name: 'Xóa Dầu lạc khỏi giỏ hàng' }));
  expect(await screen.findByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible();
});

it('changes the selected variant and applies its price and quantity rules', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(product)));
  mount();
  const selector = await screen.findByRole('combobox', { name: 'Quy cách Dầu lạc' });
  fireEvent.change(selector, { target: { value: '42' } });

  await waitFor(() => expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0]).toMatchObject({
    variantId: '42', variantName: 'Can 5L', quantity: 2, price: 400000,
  }));
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

  expect(await screen.findByText(/bộ nhớ tạm/i)).toBeVisible();
  expect(screen.getByText('Tạm tính dòng hàng: 180.000 ₫')).toBeVisible();
});

it('shows Catalog loading and an error without changing cart data, then retries successfully', async () => {
  let reject!: (reason: Error) => void;
  const fetch = vi.fn()
    .mockImplementationOnce(() => new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }))
    .mockResolvedValue(Response.json(cartCatalog));
  vi.stubGlobal('fetch', fetch);
  mount();
  expect(await screen.findByText('Đang tải quy cách…')).toBeVisible();
  const saved = localStorage.getItem('hm_naturals_cart_v1');
  await act(async () => { reject(new Error('offline')); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được quy cách');
  expect(screen.getByText('Quy cách: 1L')).toBeVisible();
  expect(localStorage.getItem('hm_naturals_cart_v1')).toBe(saved);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại tải quy cách Dầu lạc' }));
  const select = await screen.findByRole('combobox');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(within(select).getByRole('option', { name: 'Can 5L' })).toBeVisible();
  expect(localStorage.getItem('hm_naturals_cart_v1')).toBe(saved);
});

it('only offers active variants and preserves a current inactive variant until an explicit change', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...product, variants: [
    { ...product.variants[0], id: '15', name: '1L', isActive: false },
    product.variants[1],
  ] })));
  mount();
  const select = await screen.findByRole('combobox');
  expect(select).toHaveValue('');
  expect(within(select).queryByRole('option', { name: '1L' })).not.toBeInTheDocument();
  expect(within(select).getByRole('option', { name: 'Can 5L' })).toBeEnabled();
  expect(screen.getByText('Quy cách: 1L')).toBeVisible();
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].variantId).toBe('15');
});

it('keeps a valid quantity and renders the new price, total and quantity rules', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ ...fixedCart, items: [{ ...fixedCart.items[0], quantity: 4 }] }));
  mount();
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: '42' } });
  expect(await screen.findByText('Quy cách: Can 5L')).toBeVisible();
  expect(screen.getByText('400.000 ₫ / quy cách')).toBeVisible();
  expect(screen.getByText('Tạm tính dòng hàng: 1.600.000 ₫')).toBeVisible();
  expect(screen.getByText('1.600.000 ₫', { selector: 'strong' })).toBeVisible();
  expect(screen.getByRole('spinbutton')).toHaveValue(4);
  expect(screen.getByRole('spinbutton')).toHaveAttribute('min', '2');
  expect(screen.getByRole('spinbutton')).toHaveAttribute('step', '2');
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0]).toMatchObject({
    variantId: '42', quantity: 4, minQuantity: 2, quantityStep: 2, price: 400000,
  });
  expect(screen.getByRole('status')).toHaveTextContent('Đã đổi quy cách');
});

it('resets an incompatible quantity to the new minimum and explains why after the line remounts', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ ...fixedCart, items: [{ ...fixedCart.items[0], quantity: 3 }] }));
  mount();
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: '42' } });
  expect(await screen.findByText(/Số lượng 3 không phù hợp.*2/)).toBeVisible();
  expect(screen.getByRole('spinbutton')).toHaveValue(2);
  expect(screen.getByText('Tạm tính dòng hàng: 800.000 ₫')).toBeVisible();
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0].quantity).toBe(2);
});

it('retains a valid fractional quantity for a new variant', async () => {
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({
    ...fixedCart, items: [{ ...fixedCart.items[0], quantity: 1.5, minQuantity: 0.5, quantityStep: 0.5 }],
  }));
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...product, variants: [
    product.variants[0], { ...product.variants[1], minQuantity: 0.5, quantityStep: 0.5 },
  ] })));
  mount();
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: '42' } });
  expect(await screen.findByText('Quy cách: Can 5L')).toBeVisible();
  expect(screen.getByRole('spinbutton')).toHaveValue(1.5);
  expect(screen.getByText('Tạm tính dòng hàng: 600.000 ₫')).toBeVisible();
});

it('rejects a duplicate target and retains both lines, quantities and totals', async () => {
  const items = [fixedCart.items[0], { ...fixedCart.items[0], variantId: '42', variantName: 'Can 5L', price: 400000, quantity: 2, minQuantity: 2, quantityStep: 2 }];
  localStorage.setItem('hm_naturals_cart_v1', JSON.stringify({ ...fixedCart, items }));
  mount();
  const selectors = await screen.findAllByRole('combobox');
  fireEvent.change(selectors[0], { target: { value: '42' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Quy cách này đã có trong giỏ hàng');
  expect(selectors[0]).toHaveValue('15');
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toEqual(items);
  expect(screen.getByText('890.000 ₫', { selector: 'strong' })).toBeVisible();
});

it('keeps the current variant and data when the target price is invalid', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ...cartCatalog, variants: [
    cartCatalog.variants[0], { ...cartCatalog.variants[1], price: null },
  ] })));
  mount();
  const select = await screen.findByRole('combobox');
  fireEvent.change(select, { target: { value: '42' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Thông tin sản phẩm không hợp lệ');
  expect(select).toHaveValue('15');
  expect(screen.getByText('Quy cách: 1L')).toBeVisible();
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items).toEqual(fixedCart.items);
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
