import { apiFetch, mutationHeaders } from '@/lib/api/client';
import type { DiscountType, PageDto } from '@/lib/api/contracts/types';
export interface Voucher { id: string; code: string; discountType: DiscountType; discountValue: number; maxDiscount: number | null; minOrderValue: number; quantity: number; usedCount: number; startAt: string | null; endAt: string | null; isActive: boolean }
export type VoucherWrite = Omit<Voucher, 'id' | 'usedCount'>;
const path = (id: string) => '/admin/vouchers/' + encodeURIComponent(id);
export const listVouchers = (page = 0) => apiFetch<PageDto<Voucher>>(`/admin/vouchers?page=${page}&size=20`);
export const getVoucher = (id: string) => apiFetch<Voucher>(path(id));
async function write(url: string, method: string, body: unknown) { return apiFetch<Voucher>(url, { method, headers: await mutationHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }); }
export const saveVoucher = (body: VoucherWrite, id?: string) => write(id ? path(id) : '/admin/vouchers', id ? 'PUT' : 'POST', body);
export const setVoucherActive = (id: string, isActive: boolean) => write(path(id) + '/status', 'PATCH', { isActive });
