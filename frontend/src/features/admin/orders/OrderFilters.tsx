'use client';

import { adminButtonClass } from '@/features/admin/button-styles';
import { useId, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { TextField, fieldClass, formClass } from '../catalog/form-support';
import { invalid, vietnamInstant } from '../admin-format';
import { statusLabels, type OrderQuery } from './orders-admin-api';
export function OrderFilters({ onApply }: { onApply: (query: OrderQuery) => void }) {
  const prefix = useId(); const [status, setStatus] = useState(''), [orderType, setType] = useState(''), [keyword, setKeyword] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault(); setError(null);
    try {
      const start = vietnamInstant(from, 'from'), end = vietnamInstant(to, 'to');
      if (start && end && start >= end) throw invalid('to', 'Thời gian đến phải sau thời gian từ.');
      onApply({ status, orderType, keyword: keyword.trim(), from: start ?? undefined, to: end ?? undefined, page: 0 });
    } catch (failure) { setError(failure instanceof ApiClientError ? failure.message : 'Bộ lọc không hợp lệ.'); }
  }}>
    {error && <p role="alert">{error}</p>}
    <div className="grid min-w-0 gap-4 sm:grid-cols-2"><label className="text-sm">Trạng thái<select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="text-sm">Loại yêu cầu<select className={fieldClass} value={orderType} onChange={(event) => setType(event.target.value)}><option value="">Tất cả</option><option value="ORDER">Đơn đặt hàng</option><option value="QUOTE_REQUEST">Yêu cầu báo giá</option></select></label></div>
    <TextField prefix={prefix} name="keyword" label="Mã đơn hoặc điện thoại" value={keyword} onChange={setKeyword} maxLength={100} />
    <div className="grid min-w-0 gap-4 sm:grid-cols-2"><TextField prefix={prefix} name="from" label="Từ (giờ Việt Nam)" type="datetime-local" value={from} onChange={setFrom} /><TextField prefix={prefix} name="to" label="Đến, không gồm (giờ Việt Nam)" type="datetime-local" value={to} onChange={setTo} /></div>
    <button className={adminButtonClass('primary')}>Lọc yêu cầu</button>
  </form>;
}
