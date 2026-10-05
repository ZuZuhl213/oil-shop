import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { ThumbnailUpload } from './ThumbnailUpload';
import { ProductForm } from './ProductForm';
import { categories, product } from '@/test/catalog-fixtures';

const oldUrl = 'https://storage.example.test/old.png';
const newUrl = 'https://storage.example.test/products/new.png';
let upload: () => Promise<Response>;
let mediaCalls: FormData[];
beforeEach(() => {
  mediaCalls = [];
  upload = async () => Response.json({ url: newUrl, objectKey: 'products/new.png' }, { status: 201 });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'owner@example.com' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    if (url.endsWith('/media')) { mediaCalls.push(init!.body as FormData); return upload(); }
    return Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  }));
});
afterEach(() => vi.unstubAllGlobals());
function select(file = new File(['png'], 'oil.png', { type: 'image/png' })) { fireEvent.change(screen.getByLabelText('Chọn ảnh đại diện'), { target: { files: [file] } }); }

it('shows upload failure, keeps current preview and retries the selected file', async () => {
  const saved = vi.fn();
  upload = async () => Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
  render(<AdminSessionProvider><ThumbnailUpload url={oldUrl} onUploaded={saved} /></AdminSessionProvider>);
  select();
  fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải ảnh lên được');
  expect(screen.getByRole('img', { name: 'Ảnh đại diện trong bản nháp' })).toHaveAttribute('src', oldUrl);
  expect(saved).not.toHaveBeenCalled();
  upload = async () => Response.json({ url: newUrl, objectKey: 'products/new.png' }, { status: 201 });
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại tải ảnh' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(newUrl));
  expect(mediaCalls).toHaveLength(2);
  expect(mediaCalls[0].get('file')).toBeInstanceOf(File);
});

it('blocks oversized and unsupported files before contacting the API', async () => {
  render(<AdminSessionProvider><ThumbnailUpload url={oldUrl} onUploaded={vi.fn()} /></AdminSessionProvider>);
  for (const file of [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }), new File(['<svg/>'], 'oil.svg', { type: 'image/svg+xml' })]) {
    select(file);
    fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/5 MiB|JPEG/);
  }
  expect(mediaCalls).toHaveLength(0);
});

it('disables duplicate uploads while pending and keeps uploaded URL when product save fails', async () => {
  let resolve!: (response: Response) => void;
  upload = () => new Promise((done) => { resolve = done; });
  const saved = vi.fn();
  render(<AdminSessionProvider><ProductForm product={{ ...product, thumbnailUrl: oldUrl }} categories={categories} onSaved={saved} /></AdminSessionProvider>);
  fireEvent.change(screen.getByLabelText('Chọn ảnh sản phẩm'), { target: { files: [new File(['png'], 'oil.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  await waitFor(() => expect(mediaCalls).toHaveLength(1));
  expect(screen.getByRole('button', { name: 'Đang tải ảnh…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Lưu sản phẩm' })).toBeDisabled();
  resolve(Response.json({ url: newUrl, objectKey: 'products/new.png' }, { status: 201 }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Chọn ảnh 2 làm đại diện' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh 2 làm đại diện' }));
  fireEvent.click(screen.getByRole('button', { name: 'Lưu sản phẩm' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được');
  expect(screen.getByLabelText('URL ảnh đại diện')).toHaveValue(newUrl);
  expect(screen.getByRole('img', { name: 'Ảnh 2 trong bản nháp' })).toHaveAttribute('src', newUrl);
  expect(saved).not.toHaveBeenCalled();
});
