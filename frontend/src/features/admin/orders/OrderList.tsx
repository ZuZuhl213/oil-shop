'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useAdminResource } from '../catalog/use-admin-resource';
import { actionClass } from '../catalog/form-support';
import { displayVietnam, money } from '../admin-format';
import { OrderFilters } from './OrderFilters';
import { listOrders, statusLabels, type OrderQuery } from './orders-admin-api';
export function OrderList() {
  const [query, setQuery] = useState<OrderQuery>({ page: 0 }); const load = useCallback(async () => ({ query, result: await listOrders(query) }), [query]); const resource = useAdminResource(load);
  const result = resource.data?.query === query && !resource.error ? resource.data.result : null;
  return <div className="space-y-5"><h1 className="text-2xl font-semibold text-forest-green">Đơn hàng và báo giá</h1><OrderFilters onApply={setQuery} />
    {resource.error && <p role="alert">Không tải được danh sách. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></p>}
    {resource.pending || (!resource.error && !result) ? <p role="status">Đang tải yêu cầu…</p> : result && <>
      <p className="text-sm text-text-muted">{result.totalElements} yêu cầu phù hợp</p>
      {result.content.length === 0 && <p>Không có yêu cầu phù hợp.</p>}
      <ul className="space-y-3">{result.content.map((order) => <li key={order.id} className="rounded-xl border border-soft-sand bg-white-pure p-4">
        <div className="flex flex-wrap justify-between gap-3"><Link href={'/admin/orders/' + order.id} className="break-all font-semibold text-forest-green underline">{order.orderCode}</Link><span className="text-sm">{statusLabels[order.status]}</span></div>
        <p className="text-sm">{order.orderType === 'QUOTE_REQUEST' ? 'Yêu cầu báo giá' : 'Đơn đặt hàng'} · {money(order.totalAmount)}</p>
        <p className="break-words text-sm">{order.customerName} · {order.phone}</p><p className="text-sm text-text-muted">{displayVietnam(order.createdAt)} (giờ Việt Nam)</p>
      </li>)}</ul>
      <div className="flex flex-wrap items-center gap-3"><button className={actionClass} disabled={query.page === 0} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Trang trước</button><span>Trang {query.page + 1}/{Math.max(1, result.totalPages)}</span><button className={actionClass} disabled={query.page + 1 >= result.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Trang sau</button></div>
    </>}
  </div>;
}
