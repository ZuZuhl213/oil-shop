'use client';

import { adminButtonClass } from '@/features/admin/button-styles';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminResource } from '../catalog/use-admin-resource';
import { actionClass } from '../catalog/form-support';
import { listVouchers } from './voucher-admin-api';
import { VoucherForm } from './VoucherForm';
import { money } from '../admin-format';
export function VoucherList() {
  const [page, setPage] = useState(0); const [creating, setCreating] = useState(false);
  const router = useRouter(); const load = useCallback(async () => ({ page, result: await listVouchers(page) }), [page]); const resource = useAdminResource(load);
  const result = resource.data?.page === page && !resource.error ? resource.data.result : null;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-forest-green">Voucher</h1><button className={adminButtonClass('primary')} onClick={() => setCreating(true)}>Tạo voucher</button></div>
    {creating && <><VoucherForm onSaved={(saved) => router.push('/admin/vouchers/' + saved.id)} /><button className={actionClass} onClick={() => setCreating(false)}>Đóng form</button></>}
    {resource.error && <p role="alert">Không tải được voucher. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></p>}
    {resource.pending || (!resource.error && !result) ? <p role="status">Đang tải voucher…</p> : result && <>
      {result.content.length === 0 && <p>Chưa có voucher trong trang này.</p>}
      <ul className="space-y-3">{result.content.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soft-sand bg-white-pure p-4">
        <div className="min-w-0 break-words"><Link href={'/admin/vouchers/' + entry.id} className="font-semibold text-forest-green underline">{entry.code}</Link><p className="text-sm">{entry.discountType === 'FIXED' ? money(entry.discountValue) : `${entry.discountValue}%`} · {entry.isActive ? 'Hoạt động' : 'Đang ẩn'}</p><p className="text-sm text-text-muted">Đã dùng: {entry.usedCount}/{entry.quantity} · Còn lại: {entry.quantity - entry.usedCount}</p></div>
        <Link className={adminButtonClass('info') + ' min-w-0 max-w-full break-all'} href={'/admin/vouchers/' + entry.id}>Chi tiết {entry.code}</Link>
      </li>)}</ul>
      <div className="flex flex-wrap items-center gap-3"><button className={actionClass} disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page + 1}/{Math.max(1, result.totalPages)}</span><button className={actionClass} disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)}>Trang sau</button></div>
    </>}
  </div>;
}
