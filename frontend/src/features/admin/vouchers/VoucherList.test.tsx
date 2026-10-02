import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { VoucherList } from './VoucherList';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());
it('hides old voucher rows and pagination after a failed page fetch, retry reads requested page', async () => {
  let failed = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'admin@test.local' });
    if (failed) return Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    return Response.json({ content: [{ id: '1', code: url.includes('page=1') ? 'NEW-PAGE' : 'FIRST-PAGE', discountType: 'PERCENT', discountValue: 10, quantity: 5, usedCount: 0, isActive: true }], page: url.includes('page=1') ? 1 : 0, size: 20, totalElements: 21, totalPages: 2 });
  }));
  render(<AdminSessionProvider><VoucherList /></AdminSessionProvider>); await screen.findByText('FIRST-PAGE');
  failed = true; fireEvent.click(screen.getByRole('button', { name: 'Trang sau' })); await screen.findByRole('alert');
  expect(screen.queryByText('FIRST-PAGE')).not.toBeInTheDocument(); expect(screen.queryByText('Trang 2/2')).not.toBeInTheDocument();
  failed = false; fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })); await screen.findByText('NEW-PAGE'); expect(screen.getByText('Trang 2/2')).toBeVisible();
});
