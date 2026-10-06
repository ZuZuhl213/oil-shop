import { apiFetch, mutationHeaders } from '@/lib/api/client';
import type { OrderReceipt, OrderStatus, PageDto } from '@/lib/api/contracts/types';
export interface OrderItem { productId: string | null; variantId: string | null; productNameSnapshot: string; variantNameSnapshot: string | null; quantity: number; unitPrice: number | null; lineTotal: number | null }
export interface AdminOrder extends OrderReceipt { id: string; customerName: string; phone: string; address: string | null; customerNote: string | null; adminNote: string | null; voucherCodeSnapshot: string | null; items: OrderItem[]; updatedAt: string }
export type OrderQuery = { status?: string; orderType?: string; keyword?: string; from?: string; to?: string; page: number };
const path = (id: string) => '/admin/orders/' + encodeURIComponent(id);
export const getOrder = (id: string) => apiFetch<AdminOrder>(path(id));
export function listOrders(query: OrderQuery) {
  const params = new URLSearchParams({ page: String(query.page), size: '20' });
  for (const key of ['status', 'orderType', 'keyword', 'from', 'to'] as const) if (query[key]) params.set(key, query[key]!);
  return apiFetch<PageDto<AdminOrder>>('/admin/orders?' + params);
}
async function patch(url: string, body: unknown) { return apiFetch<AdminOrder>(url, { method: 'PATCH', headers: await mutationHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }); }
export const setOrderStatus = (id: string, status: OrderStatus) => patch(path(id) + '/status', { status });
export const saveOrderNote = (id: string, adminNote: string | null, expectedAdminNote: string | null) => patch(path(id) + '/note', { adminNote, expectedAdminNote });
export const statusLabels: Record<OrderStatus, string> = { NEW: 'Mới', CONTACTED: 'Đã liên hệ', CONFIRMED: 'Đã xác nhận', DELIVERING: 'Đang giao', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã hủy' };
export const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { NEW: 'CONTACTED', CONTACTED: 'CONFIRMED', CONFIRMED: 'DELIVERING', DELIVERING: 'COMPLETED' };
