import React, { Suspense } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ProductDetail from '@/app/admin/(protected)/products/[id]/page';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { categories, product } from '@/test/catalog-fixtures';

afterEach(() => vi.unstubAllGlobals());

it('keeps a newly saved variant when an earlier product PUT response arrives late', async () => {
  let finishProduct!: (response: Response) => void;
  const created = { ...product.variants[0], id: '9007199254740993', name: 'Quy cách mới' };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', email: 'owner@test.local', name: 'Admin' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/admin/categories')) return Response.json(categories);
    if (url.endsWith('/variants')) return Response.json(created, { status: 201 });
    if (init?.method === 'PUT') return new Promise<Response>((resolve) => { finishProduct = resolve; });
    return Response.json({ ...product, variants: [] });
  }));
  const params = Promise.resolve({ id: product.id });
  await act(async () => {
    render(<AdminSessionProvider><Suspense fallback="Loading"><ProductDetail params={params} /></Suspense></AdminSessionProvider>);
  });
  const saveProduct = await screen.findByRole('button', { name: 'Lưu sản phẩm' });
  fireEvent.click(saveProduct);
  const variantForm = within(screen.getByRole('heading', { name: 'Thêm quy cách' }).closest('form')!);
  fireEvent.change(variantForm.getByLabelText('Tên quy cách'), { target: { value: created.name } });
  fireEvent.change(variantForm.getByLabelText('Giá (VND)'), { target: { value: '90000' } });
  fireEvent.click(variantForm.getByRole('button', { name: 'Lưu quy cách' }));
  await screen.findByRole('heading', { name: 'Quy cách: Quy cách mới' });
  await act(async () => finishProduct(Response.json({ ...product, variants: [] })));
  expect(screen.getByRole('heading', { name: 'Quy cách: Quy cách mới' })).toBeVisible();
  expect(screen.queryByText(/Chưa có quy cách đang bán/)).not.toBeInTheDocument();
});
