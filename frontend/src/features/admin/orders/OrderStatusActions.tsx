'use client';
import type { OrderStatus } from '@/lib/api/contracts/types';
import { actionClass } from '../catalog/form-support';
import { nextStatus, type AdminOrder } from './orders-admin-api';
const actions: Partial<Record<OrderStatus, string>> = { CONTACTED: 'Đã liên hệ', CONFIRMED: 'Xác nhận yêu cầu', COMPLETED: 'Hoàn tất xử lý' };
export function OrderStatusActions({ order, pending, onChange }: { order: AdminOrder; pending: boolean; onChange: (status: OrderStatus) => void }) {
  const next = nextStatus[order.status];
  return <section aria-label="Cập nhật trạng thái" className="flex flex-wrap gap-3">
    {next ? <><button className={actionClass} disabled={pending} onClick={() => onChange(next)}>{actions[next]}</button><button className={actionClass + ' text-error-crimson'} disabled={pending} onClick={() => {
      if (window.confirm(`Hủy yêu cầu ${order.orderCode}? ${order.voucherCodeSnapshot ? 'Thao tác sẽ hoàn 1 lượt voucher. ' : ''}Không thể mở lại yêu cầu đã hủy.`)) onChange('CANCELLED');
    }}>Hủy yêu cầu</button></> : <p className="text-sm text-text-muted">Yêu cầu đã kết thúc, không thể đổi trạng thái.</p>}
  </section>;
}
