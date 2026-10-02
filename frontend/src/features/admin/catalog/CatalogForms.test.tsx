import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { CategoryForm } from './CategoryForm';
import { ProductForm } from './ProductForm';
import { VariantEditor } from './VariantEditor';
import { categories, product } from '@/test/catalog-fixtures';

let calls: { url: string; body: Record<string, unknown> }[];
let write: (url: string, init: RequestInit) => Promise<Response>;
beforeEach(() => {
  calls = [];
  write = async () => Response.json(categories[0]);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'owner@example.com' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    if (init?.method && init.method !== 'GET') {
      calls.push({ url, body: JSON.parse(init.body as string) });
      return write(url, init);
    }
    throw new Error('Unexpected URL ' + url);
  }));
});
afterEach(() => vi.unstubAllGlobals());
function mount(children: React.ReactNode) { return render(<AdminSessionProvider>{children}</AdminSessionProvider>); }

it('retains category fields for 422 field errors and 409 conflicts without reporting success', async () => {
  const saved = vi.fn();
  write = async () => Response.json({ code: 'VALIDATION_ERROR', message: 'Validation failed', fieldErrors: { slug: 'Slug không hợp lệ' } }, { status: 422 });
  mount(<CategoryForm category={categories[0]} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText('Tên danh mục'), { target: { value: 'Bản nháp' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh mục' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Slug không hợp lệ');
  expect(screen.getByLabelText('Slug')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Tên danh mục')).toHaveValue('Bản nháp');
  write = async () => Response.json({ code: 'CONFLICT', message: 'Slug already exists' }, { status: 409 });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu danh mục' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('đã tồn tại');
  expect(saved).not.toHaveBeenCalled();
});

it('prevents duplicate saves while a category request is pending', async () => {
  let resolve!: (value: Response) => void;
  write = () => new Promise((done) => { resolve = done; });
  const saved = vi.fn();
  mount(<CategoryForm category={categories[0]} onSaved={saved} />);
  const form = screen.getByRole('button', { name: 'Lưu danh mục' }).closest('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(screen.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
  await act(async () => resolve(Response.json(categories[0])));
  expect(saved).toHaveBeenCalledTimes(1);
});

it('uses string IDs, immutable sale type, and warns about products with no active variant', async () => {
  const saved = vi.fn();
  write = async () => Response.json({ ...product, variants: [] });
  mount(<ProductForm product={{ ...product, variants: [] }} categories={categories} onSaved={saved} />);
  expect(screen.getByText(/Chưa có quy cách đang bán/)).toBeVisible();
  expect(screen.getByLabelText('Loại bán')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(calls[0].body).toMatchObject({ categoryId: '21', saleType: 'FIXED_PRICE' });
  expect(calls[0].body).not.toHaveProperty('id');
  expect(calls[0].body).not.toHaveProperty('variants');
});

it('validates fractional rules against integer VND and preserves inactive variants for editing', async () => {
  const saved = vi.fn();
  write = async () => Response.json(product.variants[0]);
  mount(<VariantEditor product={product} variant={{ ...product.variants[0], isActive: false }} onSaved={saved} />);
  expect(screen.getByLabelText('Đang bán')).not.toBeChecked();
  fireEvent.change(screen.getByLabelText('Giá (VND)'), { target: { value: '999' } });
  fireEvent.change(screen.getByLabelText('Số lượng tối thiểu'), { target: { value: '0.5' } });
  fireEvent.change(screen.getByLabelText('Bước số lượng'), { target: { value: '0.5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu quy cách' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('VND nguyên');
  expect(calls).toHaveLength(0);
  fireEvent.change(screen.getByLabelText('Giá (VND)'), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu quy cách' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(calls[0].body).toMatchObject({ minQuantity: 0.5, quantityStep: 0.5, price: 1000, isActive: false });
});

it('keeps variant draft and shows SKU conflict, then keeps it through an expired session', async () => {
  const saved = vi.fn();
  write = async () => Response.json({ code: 'CONFLICT', message: 'SKU already exists' }, { status: 409 });
  mount(<VariantEditor product={product} variant={product.variants[0]} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'DRAFT-SKU' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu quy cách' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('đã tồn tại');
  expect(screen.getByLabelText('SKU')).toHaveValue('DRAFT-SKU');
  write = async () => Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu quy cách' }));
  expect(await screen.findByRole('dialog')).toBeVisible();
  expect(screen.getByLabelText('SKU')).toHaveValue('DRAFT-SKU');
  expect(saved).not.toHaveBeenCalled();
});

it('keeps server variant status when PATCH fails and only applies successful retry', async () => {
  const saved = vi.fn();
  const variant = product.variants[0];
  write = async () => Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  mount(<VariantEditor product={product} variant={variant} onSaved={saved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn quy cách' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được');
  expect(screen.getByLabelText('Đang bán')).toBeChecked();
  expect(saved).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  write = async () => Response.json({ ...variant, isActive: false });
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn quy cách' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ isActive: false })));
  expect(screen.getByLabelText('Đang bán')).not.toBeChecked();
  expect(calls[0]).toMatchObject({ url: `/api/v1/admin/variants/${variant.id}/status`, body: { isActive: false } });
});
