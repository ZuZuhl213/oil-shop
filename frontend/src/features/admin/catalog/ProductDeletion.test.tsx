import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProductsPage from '@/app/admin/(protected)/products/page';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { categories, product } from '@/test/catalog-fixtures';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
let deletes: RequestInit[];
let remove: () => Promise<Response>;
let read: () => Promise<Response>;
beforeEach(() => {
  deletes = [];
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  remove = async () => new Response(null, { status: 204 });
  read = async () => Response.json(product);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'admin@test.local' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'token', headerName: 'X-CSRF-TOKEN' });
    if (init?.method === 'DELETE') { deletes.push(init); return remove(); }
    if (url.endsWith('/categories')) return Response.json(categories);
    if (url.includes('/products?page=')) return Response.json({ content: [product], totalPages: 1 });
    if (url.endsWith('/products/' + product.id)) return read();
    throw new Error('Unexpected URL ' + url);
  }));
});
afterEach(() => vi.unstubAllGlobals());
async function mount() {
  render(<AdminSessionProvider><ProductsPage /></AdminSessionProvider>);
  return screen.findByRole('button', { name: `Xóa vĩnh viễn ${product.name}` });
}

it('does not delete when confirmation is cancelled', async () => {
  const button = await mount();
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(button);
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining(product.name));
  expect(deletes).toHaveLength(0);
  expect(screen.getByRole('link', { name: product.name })).toBeVisible();
});

it('uses CSRF, prevents duplicate requests and removes the row only after success', async () => {
  let finish!: (response: Response) => void;
  remove = () => new Promise((resolve) => { finish = resolve; });
  const button = await mount();
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(deletes).toHaveLength(1));
  expect(new Headers(deletes[0].headers).get('X-CSRF-TOKEN')).toBe('token');
  expect(screen.getByRole('link', { name: product.name })).toBeVisible();
  await act(async () => finish(new Response(null, { status: 204 })));
  expect(screen.queryByRole('link', { name: product.name })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Đã xóa vĩnh viễn');
});

it('keeps the row after an unknown outcome and verifies with GET before allowing another deletion', async () => {
  remove = async () => Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  fireEvent.click(await mount());
  expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác định');
  expect(screen.getByRole('button', { name: `Xóa vĩnh viễn ${product.name}` })).toBeDisabled();
  expect(deletes).toHaveLength(1);
  read = async () => Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  fireEvent.click(screen.getByRole('button', { name: `Kiểm tra kết quả xóa ${product.name}` }));
  await waitFor(() => expect(screen.queryByRole('link', { name: product.name })).not.toBeInTheDocument());
  expect(deletes).toHaveLength(1);
});

it('retains the row and allows verification to unlock a retry when the product still exists', async () => {
  remove = async () => Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  fireEvent.click(await mount());
  fireEvent.click(await screen.findByRole('button', { name: `Kiểm tra kết quả xóa ${product.name}` }));
  await waitFor(() => expect(screen.getByRole('button', { name: `Xóa vĩnh viễn ${product.name}` })).toBeEnabled());
  expect(deletes).toHaveLength(1);
  expect(screen.getByRole('link', { name: product.name })).toBeVisible();
});
