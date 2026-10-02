'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useAdminResource } from '../catalog/use-admin-resource';
import { actionClass } from '../catalog/form-support';
import { getVoucher } from './voucher-admin-api';
import { VoucherForm } from './VoucherForm';
export function VoucherDetail({ id }: { id: string }) {
  const load = useCallback(() => getVoucher(id), [id]); const resource = useAdminResource(load);
  return <div className="space-y-5"><Link href="/admin/vouchers" className="text-forest-green underline">← Danh sách voucher</Link>
    {resource.error && <p role="alert">Không tải được voucher. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></p>}
    {!resource.data ? <p role="status">Đang tải voucher…</p> : <>
      <h1 className="break-words text-2xl font-semibold text-forest-green">Voucher: {resource.data.code}</h1>
      <VoucherForm key={id} voucher={resource.data} onSaved={resource.setData} />
    </>}
  </div>;
}
