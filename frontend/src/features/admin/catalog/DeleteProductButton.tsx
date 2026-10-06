'use client';

import { useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { adminButtonClass } from '../button-styles';
import { deleteProduct, getProduct } from './catalog-admin-api';
import { errorMessage, useAdminMutation } from './form-support';

export function DeleteProductButton({ id, name, disabled, onDeleted }: {
  id: string; name: string; disabled?: boolean; onDeleted: () => void;
}) {
  const [unknown, setUnknown] = useState(false);
  const mutation = useAdminMutation((error) => error instanceof ApiClientError && error.status < 500 && error.status !== 408
    ? errorMessage(error)
    : 'Chưa xác định kết quả xóa. Kiểm tra kết quả trước khi thử lại.');
  const missing = (error: unknown) => error instanceof ApiClientError && error.status === 404;
  return <div className="min-w-0 space-y-2">
    <button type="button" className={adminButtonClass('danger')} disabled={disabled || mutation.pending || unknown}
      aria-label={`Xóa vĩnh viễn ${name}`} onClick={() => {
        if (disabled || mutation.pending || unknown) return;
        if (!window.confirm(`Xóa vĩnh viễn sản phẩm “${name}” và toàn bộ quy cách? Không thể khôi phục. Lịch sử đơn hàng vẫn được giữ.`)) return;
        void mutation.run(async () => {
          try { await deleteProduct(id); }
          catch (error) {
            if (missing(error)) return;
            if (!(error instanceof ApiClientError) || error.status >= 500 || error.status === 408) setUnknown(true);
            throw error;
          }
        }, onDeleted);
      }}>{mutation.pending ? 'Đang xử lý…' : 'Xóa vĩnh viễn'}</button>
    {mutation.error && <p role="alert" className="max-w-sm text-sm text-error-crimson">{mutation.error.message}</p>}
    {unknown && <button type="button" className={adminButtonClass('info')} disabled={mutation.pending}
      aria-label={`Kiểm tra kết quả xóa ${name}`} onClick={() => {
        void mutation.run(async () => {
          try { await getProduct(id); return false; }
          catch (error) { if (missing(error)) return true; throw error; }
        }, (deleted) => { if (deleted) onDeleted(); else setUnknown(false); });
      }}>Kiểm tra kết quả xóa</button>}
  </div>;
}
