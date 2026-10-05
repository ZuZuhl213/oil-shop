import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ProductImagesEditor } from './ProductImagesEditor';
const upload = vi.hoisted(() => vi.fn());
vi.mock('./catalog-admin-api', () => ({ uploadThumbnail: upload }));
vi.mock('../AdminSessionProvider', () => ({ useAdminSession: () => ({ execute: (f: () => unknown) => f() }) }));
function Harness() {
  const [urls, setUrls] = useState(['https://media.test/a.png', 'https://media.test/b.png']);
  const [cover, setCover] = useState(urls[0]);
  return <ProductImagesEditor urls={urls} cover={cover} onChange={(next, thumbnail) => { setUrls(next); setCover(thumbnail ?? ''); }} />;
}
it('changes order and cover, and selects a remaining cover when removed', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Đưa ảnh 2 lên' }));
  expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://media.test/b.png');
  fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh 1 làm đại diện' }));
  expect(screen.getByRole('button', { name: 'Ảnh 1 là đại diện' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Gỡ ảnh 1 khỏi sản phẩm' }));
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Ảnh 1 là đại diện' })).toBeInTheDocument();
});
it('retains successful uploads and retries only a failed file', async () => {
  upload.mockReset().mockResolvedValueOnce({ url: 'https://media.test/c.png' }).mockRejectedValueOnce(new Error('upstream')).mockResolvedValueOnce({ url: 'https://media.test/d.png' });
  render(<Harness />);
  fireEvent.change(screen.getByLabelText('Chọn ảnh sản phẩm'), { target: { files: [new File(['c'], 'c.png', { type: 'image/png' }), new File(['d'], 'd.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: /^Tải ảnh lên$/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('d.png');
  expect(screen.getAllByRole('img')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại ảnh lỗi' }));
  await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(4));
  expect(upload.mock.calls.map(([file]) => file.name)).toEqual(['c.png', 'd.png', 'd.png']);
});
