'use client';
import { useId, useState } from 'react';
import { useAdminSession } from '../AdminSessionProvider';
import { ApiClientError } from '@/lib/api/client';
import type { DiscountType } from '@/lib/api/contracts/types';
import { FormFeedback, TextField, formClass, errorMessage, useAdminMutation } from '../catalog/form-support';
import { integer, invalid, localVietnam, vietnamInstant } from '../admin-format';
import { getVoucher, saveVoucher, setVoucherActive, type Voucher } from './voucher-admin-api';
export function voucherError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) return 'Mã voucher đã tồn tại. Kiểm tra lại; bản nháp vẫn được giữ.';
  if (error instanceof ApiClientError && error.status === 422 && Object.keys(error.fieldErrors).length === 0) return 'Voucher không hợp lệ. Kiểm tra tổng lượt với số đã dùng, thời gian và giá trị giảm; bản nháp vẫn được giữ.';
  return errorMessage(error);
}
export function VoucherForm({ voucher, onSaved }: { voucher?: Voucher; onSaved: (voucher: Voucher) => void }) {
  const { execute } = useAdminSession();
  const prefix = useId(); const mutation = useAdminMutation(voucherError);
  const [usage, setUsage] = useState(voucher);
  const [draft, setDraft] = useState({ code: voucher?.code ?? '', discountType: voucher?.discountType ?? 'FIXED' as DiscountType, discountValue: String(voucher?.discountValue ?? ''), maxDiscount: voucher?.maxDiscount == null ? '' : String(voucher.maxDiscount), minOrderValue: String(voucher?.minOrderValue ?? 0), quantity: String(voucher?.quantity ?? 0), startAt: localVietnam(voucher?.startAt ?? null), endAt: localVietnam(voucher?.endAt ?? null), isActive: voucher?.isActive ?? true });
  const change = (name: keyof typeof draft, value: string | boolean) => setDraft((current) => ({ ...current, [name]: value }));
  const [usageError, setUsageError] = useState(false);
  const fields = mutation.error?.fields;
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault();
    void mutation.run(async () => {
      const startAt = voucher && draft.startAt === localVietnam(voucher.startAt) ? voucher.startAt : vietnamInstant(draft.startAt, 'startAt');
      const endAt = voucher && draft.endAt === localVietnam(voucher.endAt) ? voucher.endAt : vietnamInstant(draft.endAt, 'endAt');
      if (startAt && endAt && new Date(startAt).getTime() >= new Date(endAt).getTime()) throw invalid('endAt', 'Kết thúc phải sau thời gian bắt đầu.');
      const body = { code: draft.code.trim().toUpperCase(), discountType: draft.discountType, discountValue: integer(draft.discountValue, 'discountValue', 'Giá trị giảm', 1, draft.discountType === 'PERCENT' ? 100 : 9_000_000_000_000), maxDiscount: draft.discountType === 'FIXED' || draft.maxDiscount === '' ? null : integer(draft.maxDiscount, 'maxDiscount', 'Giảm tối đa', 1, 9_000_000_000_000), minOrderValue: integer(draft.minOrderValue, 'minOrderValue', 'Đơn tối thiểu', 0, 9_000_000_000_000), quantity: integer(draft.quantity, 'quantity', 'Tổng lượt', 0, 2147483647), startAt, endAt, isActive: draft.isActive };
      if (!body.code || body.code.length > 50) throw invalid('code', 'Mã voucher cần 1–50 ký tự.');
      try { return await saveVoucher(body, voucher?.id); }
      catch (error) {
        if (voucher && error instanceof ApiClientError && error.status === 422) {
          try { setUsage(await execute(() => getVoucher(voucher.id))); setUsageError(false); } catch { setUsageError(true); }
        }
        throw error;
      }
    }, (saved) => { setUsage(saved); setUsageError(false); onSaved(saved); });
  }}>
    <h2 className="text-lg font-semibold text-forest-green">{voucher ? 'Sửa voucher' : 'Tạo voucher'}</h2>
    <FormFeedback mutation={mutation} prefix={prefix} />
    {usage && <p className="text-sm">Đã dùng: {usage.usedCount} · Còn lại: {usage.quantity - usage.usedCount}</p>}
    <p className="text-sm text-text-muted">Số lượt là dữ liệu lần tải gần nhất, có thể thay đổi khi khách đặt đơn. Thời gian nhập theo giờ Việt Nam (UTC+7).</p>
    {usageError && <p role="alert">Chưa tải lại được số lượt đã dùng. <button type="button" onClick={() => void mutation.run(() => getVoucher(voucher!.id), (saved) => { setUsage(saved); setUsageError(false); }, 'Đã tải lại số lượt.')}>Thử tải lại</button></p>}
    <fieldset disabled={mutation.pending} className="min-w-0 space-y-4">
      <TextField label="Mã voucher" name="code" prefix={prefix} value={draft.code} onChange={(value) => change('code', value)} errors={fields} required maxLength={50} />
      <label className="block text-sm">Loại giảm<select className="mt-1 min-h-11 w-full rounded-lg border border-soft-sand px-3" value={draft.discountType} onChange={(event) => change('discountType', event.target.value)}><option value="FIXED">Số tiền (VND)</option><option value="PERCENT">Phần trăm (%)</option></select></label>
      <TextField label="Giá trị giảm" name="discountValue" prefix={prefix} value={draft.discountValue} onChange={(value) => change('discountValue', value)} errors={fields} type="number" min={1} step="1" required />
      {draft.discountType === 'PERCENT' && <><TextField label="Giảm tối đa (VND)" name="maxDiscount" prefix={prefix} value={draft.maxDiscount} onChange={(value) => change('maxDiscount', value)} errors={fields} type="number" min={1} step="1" /><p className="text-sm text-text-muted">Để trống nếu không giới hạn; 0 không hợp lệ.</p></>}
      <TextField label="Đơn tối thiểu (VND)" name="minOrderValue" prefix={prefix} value={draft.minOrderValue} onChange={(value) => change('minOrderValue', value)} errors={fields} type="number" min={0} step="1" required />
      <TextField label="Tổng lượt" name="quantity" prefix={prefix} value={draft.quantity} onChange={(value) => change('quantity', value)} errors={fields} type="number" min={0} step="1" required />
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">{(['startAt', 'endAt'] as const).map((name) => <TextField key={name} label={name === 'startAt' ? 'Bắt đầu (giờ Việt Nam)' : 'Kết thúc (giờ Việt Nam)'} name={name} prefix={prefix} value={draft[name]} onChange={(value) => change(name, value)} errors={fields} type="datetime-local" />)}</div>
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={(event) => change('isActive', event.target.checked)} />Voucher hoạt động</label>
      <button className="btn-action-touch fixed-flow" type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu voucher'}</button>
    </fieldset>
    {usage && <button type="button" disabled={mutation.pending} className="min-h-11 rounded-lg border border-soft-sand px-4 py-2 text-forest-green" onClick={() => void mutation.run(() => setVoucherActive(usage.id, !usage.isActive), (saved) => { setUsage(saved); change('isActive', saved.isActive); onSaved(saved); }, 'Đã cập nhật trạng thái voucher.')}>{usage.isActive ? 'Ẩn voucher' : 'Kích hoạt voucher'}</button>}
  </form>;
}
