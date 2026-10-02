import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { VoucherForm } from './VoucherForm';
import { type Voucher } from './voucher-admin-api';

const voucher: Voucher = { id: '9007199254740993', code: 'OLD', discountType: 'PERCENT', discountValue: 10, maxDiscount: null, minOrderValue: 0, quantity: 5, usedCount: 2, startAt: '2026-10-02T00:00:00Z', endAt: null, isActive: true };
let calls: { url: string; body: Record<string, unknown> }[];
let write: () => Promise<Response>;
let latest: Voucher;
beforeEach(() => {
  calls = []; latest = voucher; write = async () => Response.json(voucher);
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'a@test.vn' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'token', headerName: 'X-CSRF-TOKEN' });
    if (init?.method && init.method !== 'GET') { calls.push({ url, body: JSON.parse(init.body as string) }); return write(); }
    return Response.json(latest);
  }));
});
afterEach(() => vi.unstubAllGlobals());
function mount() { const saved = vi.fn(); render(<AdminSessionProvider><VoucherForm voucher={voucher} onSaved={saved} /></AdminSessionProvider>); return saved; }
function change(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function submit() { fireEvent.submit(screen.getByRole('button', { name: 'Lưu voucher' }).closest('form')!); }

it('normalizes only code, keeps usedCount read-only and converts Vietnam time independent of host timezone', async () => {
  const saved = mount();
  expect(screen.getByLabelText('Bắt đầu (giờ Việt Nam)')).toHaveValue('2026-10-02T07:00');
  expect(screen.getByText('Đã dùng: 2 · Còn lại: 3')).toBeVisible();
  expect(screen.queryByRole('spinbutton', { name: /Đã dùng/ })).not.toBeInTheDocument();
  change('Mã voucher', ' welcome '); change('Kết thúc (giờ Việt Nam)', '2026-10-03T07:30'); submit();
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(calls[0]).toMatchObject({ url: `/api/v1/admin/vouchers/${voucher.id}`, body: { code: 'WELCOME', minOrderValue: 0, maxDiscount: null, startAt: '2026-10-02T00:00:00Z', endAt: '2026-10-03T00:30:00.000Z' } });
  expect(calls[0].body).not.toHaveProperty('usedCount'); expect(calls[0].body).not.toHaveProperty('id');
});
it('validates percent 1..100, cap zero, and start before end without changing draft', async () => {
  mount();
  for (const value of ['0', '101', '1.5']) {
    change('Giá trị giảm', value); submit(); expect(await screen.findByRole('alert')).toHaveTextContent('Giá trị giảm');
  }
  change('Giá trị giảm', '100'); change('Giảm tối đa (VND)', '0'); submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('Giảm tối đa');
  expect(screen.getByLabelText('Giảm tối đa (VND)')).toHaveValue(0);
  change('Giảm tối đa (VND)', ''); change('Kết thúc (giờ Việt Nam)', '2026-10-02T07:00'); submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('Kết thúc'); expect(calls).toHaveLength(0);
});
it('sends FIXED with null cap and permits zero minimum and zero quantity', async () => {
  const saved = mount(); change('Giảm tối đa (VND)', '50000'); change('Loại giảm', 'FIXED'); change('Giá trị giảm', '50000'); change('Tổng lượt', '0'); submit();
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(calls[0].body).toMatchObject({ discountType: 'FIXED', discountValue: 50000, maxDiscount: null, minOrderValue: 0, quantity: 0 });
});
it('reloads usage after server rejects quantity following concurrent consumption, retaining all draft fields', async () => {
  mount(); latest = { ...voucher, usedCount: 4 };
  write = async () => Response.json({ code: 'VALIDATION_ERROR', message: 'Voucher is invalid', fieldErrors: {} }, { status: 422 });
  change('Mã voucher', 'DRAFT'); change('Tổng lượt', '3'); submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('không hợp lệ');
  expect(await screen.findByText('Đã dùng: 4 · Còn lại: 1')).toBeVisible();
  expect(screen.getByLabelText('Tổng lượt')).toHaveValue(3); expect(screen.getByLabelText('Mã voucher')).toHaveValue('DRAFT');
});
it('keeps draft for code conflict, session expiry and prevents duplicate submits', async () => {
  mount(); write = async () => Response.json({ code: 'CONFLICT' }, { status: 409 }); change('Mã voucher', 'DRAFT'); submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('Mã voucher đã tồn tại');
  let resolve!: (value: Response) => void; write = () => new Promise((done) => { resolve = done; }); const form = screen.getByRole('button', { name: 'Lưu voucher' }).closest('form')!; fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => expect(calls).toHaveLength(2));
  expect(screen.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
  await act(async () => resolve(Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 })));
  expect(await screen.findByRole('dialog', { name: 'Đăng nhập lại' })).toBeVisible(); expect(screen.getByLabelText('Mã voucher')).toHaveValue('DRAFT');
});

it('updates form active state after dedicated status PATCH so a later save cannot revert it', async () => {
  mount(); write = async () => Response.json({ ...voucher, isActive: false });
  fireEvent.click(screen.getByRole('button', { name: 'Ẩn voucher' }));
  await waitFor(() => expect(screen.getByLabelText('Voucher hoạt động')).not.toBeChecked());
  submit(); await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[0]).toMatchObject({ url: `/api/v1/admin/vouchers/${voucher.id}/status`, body: { isActive: false } });
  expect(calls[1].body.isActive).toBe(false);
});

it('preserves seconds in unchanged Instant fields rather than truncating existing boundaries', async () => {
  const precise = { ...voucher, startAt: '2026-10-02T00:00:34.123Z' }; const saved = vi.fn();
  render(<AdminSessionProvider><VoucherForm voucher={precise} onSaved={saved} /></AdminSessionProvider>);
  submit(); await waitFor(() => expect(saved).toHaveBeenCalled()); expect(calls[0].body.startAt).toBe(precise.startAt);
});
it('opens login recovery if reloading usage returns 401 after a rejected write', async () => {
  mount(); write = async () => Response.json({ code: 'VALIDATION_ERROR' }, { status: 422 });
  const prior = globalThis.fetch;
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => !init?.method && url.includes('/admin/vouchers/')
    ? Promise.resolve(Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 })) : prior(url, init)));
  change('Tổng lượt', '1'); submit();
  expect(await screen.findByRole('dialog', { name: 'Đăng nhập lại' })).toBeVisible();
  expect(screen.getByLabelText('Tổng lượt')).toHaveValue(1);
});
