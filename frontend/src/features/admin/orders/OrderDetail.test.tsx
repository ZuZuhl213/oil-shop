import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '../AdminSessionProvider';
import { OrderDetail } from './OrderDetail';
import { OrderList } from './OrderList';
import { type AdminOrder } from './orders-admin-api';
const order: AdminOrder = { id: '9007199254740993', orderCode: 'DH-20261002-1', orderType: 'ORDER', status: 'NEW', subtotal: 430000, discountAmount: 43000, totalAmount: 387000, createdAt: '2026-10-02T00:00:00Z', updatedAt: '2026-10-02T00:00:00Z', customerName: 'Khách cũ', phone: '0901234567', address: 'Địa chỉ snapshot', customerNote: 'Ghi chú của khách', adminNote: 'Note cũ', voucherCodeSnapshot: 'WELCOME', items: [{ productId: null, variantId: null, productNameSnapshot: 'Dầu cũ', variantNameSnapshot: '1L cũ', quantity: 2, unitPrice: 170000, lineTotal: 340000 }] };
let latest: AdminOrder; let calls: { url: string; body: Record<string, unknown> }[]; let reads: string[];
let write: (url: string, body: Record<string, unknown>) => Promise<Response>;
beforeEach(() => {
  latest = order; calls = []; reads = []; write = async (_, body) => Response.json({ ...latest, ...body });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/me')) return Response.json({ id: '1', name: 'Admin', email: 'a@test.vn' });
    if (url.endsWith('/csrf')) return Response.json({ token: 'csrf', headerName: 'X-CSRF-TOKEN' });
    if (init?.method === 'PATCH') { const body = JSON.parse(init.body as string); calls.push({ url, body }); return write(url, body); }
    reads.push(url);
    if (url.includes('?')) return Response.json({ content: [latest], page: 0, size: 20, totalElements: 21, totalPages: 2 });
    return Response.json(latest);
  }));
});
afterEach(() => vi.unstubAllGlobals());
function mount(element = <OrderDetail id={order.id} />) { render(<AdminSessionProvider>{element}</AdminSessionProvider>); }

it('renders historical snapshots, backend totals, voucher and separate customer/admin notes', async () => {
  mount(); expect(await screen.findByText('Dầu cũ')).toBeVisible(); expect(screen.getByText('1L cũ')).toBeVisible();
  expect(screen.getByText('WELCOME')).toBeVisible(); expect(screen.getAllByText('Ghi chú của khách').some((element) => element.tagName === 'DD')).toBe(true);
  expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Note cũ');
  expect(screen.getByText(/387.000/)).toBeVisible(); expect(screen.queryByRole('button', { name: 'Hoàn tất xử lý' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Đã liên hệ' })).toBeEnabled();
});
it('keeps quote NULL prices and explains completed quote does not count as revenue', async () => {
  latest = { ...order, orderType: 'QUOTE_REQUEST', subtotal: null, totalAmount: null, discountAmount: 0, voucherCodeSnapshot: null, status: 'CONFIRMED', items: order.items.map((item) => ({ ...item, unitPrice: null, lineTotal: null })) };
  mount(); expect(await screen.findByText('Yêu cầu báo giá')).toBeVisible(); expect(screen.getAllByText('Chưa có giá').length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText(/không ghi nhận doanh thu/)).toBeVisible(); fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất xử lý' }));
  await waitFor(() => expect(calls[0].body).toEqual({ status: 'COMPLETED' }));
});
it('requires cancellation confirmation, sends only status and prevents duplicate actions', async () => {
  mount(); await screen.findByText('Dầu cũ'); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Hủy yêu cầu' })); expect(calls).toHaveLength(0);
  confirm.mockReturnValue(true); let resolve!: (value: Response) => void; write = () => new Promise((done) => { resolve = done; });
  const button = screen.getByRole('button', { name: 'Hủy yêu cầu' }); fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(calls).toHaveLength(1)); expect(confirm).toHaveBeenCalledWith(expect.stringContaining('hoàn 1 lượt voucher'));
  expect(screen.getByRole('button', { name: 'Lưu ghi chú' })).toBeDisabled();
  await act(async () => resolve(Response.json({ ...order, status: 'CANCELLED' })));
  expect(await screen.findByText('Đã hủy')).toBeVisible(); expect(screen.queryByRole('button', { name: 'Đã liên hệ' })).not.toBeInTheDocument();
});
it('refreshes real state after 409 while preserving unsaved note draft', async () => {
  latest = { ...order, status: 'CONTACTED' }; mount(); await screen.findByText('Dầu cũ');
  fireEvent.change(screen.getByLabelText('Ghi chú quản trị'), { target: { value: 'Draft cần giữ' } });
  latest = { ...order, status: 'CANCELLED' }; write = async () => Response.json({ code: 'INVALID_TRANSITION' }, { status: 409 });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận yêu cầu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Trạng thái đã thay đổi'); expect(screen.getByText('Đã hủy')).toBeVisible();
  expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Draft cần giữ'); expect(screen.queryByRole('button', { name: 'Xác nhận yêu cầu' })).not.toBeInTheDocument();
});
it('retains note after 503 and 401 and saves only adminNote without localStorage PII', async () => {
  mount(); await screen.findByText('Dầu cũ'); const storage = vi.spyOn(Storage.prototype, 'setItem');
  fireEvent.change(screen.getByLabelText('Ghi chú quản trị'), { target: { value: 'Draft nhạy cảm' } });
  write = async () => Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 }); fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được'); expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Draft nhạy cảm');
  write = async () => Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 }); fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' }));
  expect(await screen.findByRole('dialog', { name: 'Đăng nhập lại' })).toBeVisible(); expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Draft nhạy cảm');
  expect(calls[0].body).toEqual({ adminNote: 'Draft nhạy cảm' }); expect(storage).not.toHaveBeenCalled();
});
it('applies status/type/keyword/exclusive date filters, paginates, resets page for new filters', async () => {
  mount(<OrderList />); await screen.findByText(order.orderCode);
  fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'CONTACTED' } }); fireEvent.change(screen.getByLabelText('Loại yêu cầu'), { target: { value: 'QUOTE_REQUEST' } });
  fireEvent.change(screen.getByLabelText('Mã đơn hoặc điện thoại'), { target: { value: '090' } });
  fireEvent.change(screen.getByLabelText('Từ (giờ Việt Nam)'), { target: { value: '2026-10-02T07:00' } });
  fireEvent.change(screen.getByLabelText('Đến, không gồm (giờ Việt Nam)'), { target: { value: '2026-10-03T07:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lọc yêu cầu' }));
  await waitFor(() => expect(reads.at(-1)).toContain('orderType=QUOTE_REQUEST'));
  const query = new URL(reads.at(-1)!, 'http://test').searchParams; expect(Object.fromEntries(query)).toMatchObject({ status: 'CONTACTED', keyword: '090', from: '2026-10-02T00:00:00.000Z', to: '2026-10-03T00:00:00.000Z', page: '0', size: '20' });
  fireEvent.click(await screen.findByRole('button', { name: 'Trang sau' })); await waitFor(() => expect(reads.at(-1)).toContain('page=1'));
  fireEvent.click(screen.getByRole('button', { name: 'Lọc yêu cầu' })); await waitFor(() => expect(reads.at(-1)).toContain('page=0'));
});

it('blocks stale status actions when conflict reload fails and allows an explicit refresh without losing note', async () => {
  latest = { ...order, status: 'CONTACTED' }; mount(); await screen.findByText('Dầu cũ');
  fireEvent.change(screen.getByLabelText('Ghi chú quản trị'), { target: { value: 'Draft' } });
  const prior = globalThis.fetch; let failed = true;
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => !init?.method && url.endsWith('/orders/' + order.id) && failed
    ? Promise.resolve(Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 })) : prior(url, init)));
  write = async () => Response.json({ code: 'INVALID_TRANSITION' }, { status: 409 });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận yêu cầu' }));
  await screen.findByText('Chưa tải được trạng thái mới.');
  expect(screen.getByRole('button', { name: 'Xác nhận yêu cầu' })).toBeDisabled();
  failed = false; latest = { ...order, status: 'CANCELLED' }; fireEvent.click(screen.getByRole('button', { name: 'Tải lại trạng thái' }));
  expect(await screen.findByText('Đã hủy')).toBeVisible(); expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Draft');
});
it('associates admin note API field errors with the retained note input', async () => {
  mount(); await screen.findByText('Dầu cũ'); write = async () => Response.json({ code: 'VALIDATION_ERROR', fieldErrors: { adminNote: 'Ghi chú quá dài' } }, { status: 422 });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' })); await screen.findByRole('alert');
  expect(screen.getByLabelText('Ghi chú quản trị')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Ghi chú quản trị')).toHaveAttribute('id', 'order-adminNote');
});

it('adopts refreshed server note when untouched, preserves dirty draft, then resets baseline after saving', async () => {
  mount(); await screen.findByText('Dầu cũ');
  write = async (_, body) => Response.json({ ...order, ...body, adminNote: 'Note từ admin khác' });
  fireEvent.click(screen.getByRole('button', { name: 'Đã liên hệ' }));
  await waitFor(() => expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Note từ admin khác'));
  fireEvent.change(screen.getByLabelText('Ghi chú quản trị'), { target: { value: 'Draft của tôi' } });
  write = async (_, body) => Response.json({ ...order, ...body, adminNote: 'Note từ admin thứ ba' });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận yêu cầu' }));
  await screen.findByRole('button', { name: 'Hoàn tất xử lý' });
  expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Draft của tôi');
  write = async (_, body) => Response.json({ ...order, status: 'CONFIRMED', ...body });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu ghi chú' })); await screen.findByText('Đã lưu ghi chú.');
  write = async (_, body) => Response.json({ ...order, ...body, adminNote: 'Note mới sau khi đã lưu' });
  fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất xử lý' }));
  await waitFor(() => expect(screen.getByLabelText('Ghi chú quản trị')).toHaveValue('Note mới sau khi đã lưu'));
});
it('hides previous rows/page counts after failed pagination and failed filters, then retry restores correct query data', async () => {
  mount(<OrderList />); await screen.findByText(order.orderCode);
  const prior = globalThis.fetch; let failed = true;
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => url.includes('/admin/orders?') && failed
    ? Promise.resolve(Response.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 })) : prior(url, init)));
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' })); await screen.findByRole('alert');
  expect(screen.queryByText(order.orderCode)).not.toBeInTheDocument(); expect(screen.queryByText(/Trang 2/)).not.toBeInTheDocument();
  failed = false; latest = { ...order, orderCode: 'SECOND-PAGE' }; fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await screen.findByText('SECOND-PAGE'); expect(reads.at(-1)).toContain('page=1');
  failed = true; fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'CANCELLED' } }); fireEvent.click(screen.getByRole('button', { name: 'Lọc yêu cầu' })); await screen.findByRole('alert');
  expect(screen.queryByText('SECOND-PAGE')).not.toBeInTheDocument();
  failed = false; latest = { ...order, status: 'CANCELLED', orderCode: 'FILTERED-RESULT' }; fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await screen.findByText('FILTERED-RESULT'); expect(reads.at(-1)).toContain('status=CANCELLED'); expect(reads.at(-1)).toContain('page=0');
});
