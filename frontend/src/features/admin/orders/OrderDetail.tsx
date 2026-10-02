'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ApiClientError } from '@/lib/api/client';
import type { OrderStatus } from '@/lib/api/contracts/types';
import { useAdminSession } from '../AdminSessionProvider';
import { useAdminResource } from '../catalog/use-admin-resource';
import { FormFeedback, formClass, actionClass, errorMessage, useAdminMutation } from '../catalog/form-support';
import { money, displayVietnam } from '../admin-format';
import { getOrder, saveOrderNote, setOrderStatus, statusLabels } from './orders-admin-api';
import { OrderStatusActions } from './OrderStatusActions';
import { OrderNoteForm, type NoteConflict } from './OrderNoteForm';
class UnknownStatusOutcome extends Error {}
class RecoveryReadFailure extends Error {}
export function OrderDetail({ id }: { id: string }) {
  const load = useCallback(() => getOrder(id), [id]); const resource = useAdminResource(load);
  const { execute } = useAdminSession(); const [stale, setStale] = useState(false);
  const [unknownStatus, setUnknownStatus] = useState<{ target: OrderStatus; previous: OrderStatus } | null>(null);
  const [noteConflict, setNoteConflict] = useState<NoteConflict | null>(null);
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const mutation = useAdminMutation((error) => {
    if (error instanceof UnknownStatusOutcome) return 'Kết quả đổi trạng thái chưa được xác nhận. Tải lại trạng thái trước khi thao tác tiếp.';
    if (error instanceof RecoveryReadFailure) return 'Chưa tải được dữ liệu mới. Hãy tải lại; bản nháp vẫn được giữ.';
    if (error instanceof ApiClientError && error.code === 'NOTE_CONFLICT') return 'Ghi chú có xung đột. Xem lại ghi chú mới trước khi lưu.';
    return error instanceof ApiClientError && error.status === 409
      ? 'Trạng thái đã thay đổi hoặc dữ liệu có xung đột. Đã tải lại trạng thái thật nếu kết nối thành công; kiểm tra trước khi thao tác tiếp.' : errorMessage(error);
  });
  const recoveryLoad = async () => {
    try { return await load(); } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) throw error;
      throw new RecoveryReadFailure('Recovery GET failed', { cause: error });
    }
  };
  const reload = () => void mutation.run(recoveryLoad, (saved) => {
    resource.setData(saved); setStale(false); setUnknownStatus(null);
    setStatusConfirmation(unknownStatus && saved.status === unknownStatus.target ? `Đã xác nhận trạng thái: ${statusLabels[saved.status]}.`
      : unknownStatus && saved.status === unknownStatus.previous ? 'Trạng thái chưa thay đổi. Bạn có thể chủ động thử lại.' : `Trạng thái hiện tại: ${statusLabels[saved.status]}.`);
  }, 'Đã tải lại trạng thái thật.');
  const reloadNote = () => void mutation.run(recoveryLoad, (saved) => { resource.setData(saved); setNoteConflict({ phase: 'ready', note: saved.adminNote }); }, 'Đã tải ghi chú mới. Xem lại trước khi lưu.');
  if (!resource.data) return resource.error ? <p role="alert">Không tải được yêu cầu. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></p> : <p role="status">Đang tải yêu cầu…</p>;
  const order = resource.data; const quote = order.orderType === 'QUOTE_REQUEST';
  return <div className="space-y-5">
    <Link className="text-forest-green underline" href="/admin/orders">← Danh sách yêu cầu</Link>
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="break-all text-2xl font-semibold text-forest-green">{order.orderCode}</h1><span className="rounded-full border border-soft-sand bg-white-pure px-3 py-2 text-sm">{quote ? 'Yêu cầu báo giá' : 'Đơn đặt hàng'}</span></div>
    <p className="font-semibold text-forest-green">{statusLabels[order.status]}</p>
    <p className="text-sm text-text-muted">Tạo: {displayVietnam(order.createdAt)} · Cập nhật: {displayVietnam(order.updatedAt)} (giờ Việt Nam)</p>
    <FormFeedback mutation={mutation} prefix="order" />
    {statusConfirmation && <p role="status">{statusConfirmation}</p>}
    {stale && <p role="alert">{unknownStatus ? 'Cần xác minh trạng thái thực tế. Các thao tác đổi trạng thái đang bị khóa.' : 'Chưa tải được trạng thái mới.'} <button disabled={mutation.pending} className={actionClass} onClick={reload}>Tải lại trạng thái</button></p>}
    <OrderStatusActions order={order} pending={mutation.pending || stale} onChange={(status) => void mutation.run(async () => {
      setStatusConfirmation(null);
      try { return await setOrderStatus(id, status); }
      catch (error) {
        if (!(error instanceof ApiClientError) || error.status >= 500 || error.status === 408) {
          setStale(true); setUnknownStatus({ target: status, previous: order.status });
          throw new UnknownStatusOutcome('Status response not confirmed', { cause: error });
        }
        if (error instanceof ApiClientError && error.status === 409) {
          setStale(true);
          try { resource.setData(await execute(load)); setStale(false); } catch { /* Keep stale state blocked; session.execute handles 401. */ }
        }
        throw error;
      }
    }, resource.setData, 'Đã cập nhật trạng thái.')} />
    <section className={formClass} aria-label="Khách hàng"><h2 className="text-lg font-semibold text-forest-green">Thông tin khách hàng</h2><dl className="space-y-2 break-words"><div><dt className="text-sm text-text-muted">Họ tên</dt><dd>{order.customerName}</dd></div><div><dt className="text-sm text-text-muted">Điện thoại</dt><dd>{order.phone}</dd></div><div><dt className="text-sm text-text-muted">Địa chỉ</dt><dd className="whitespace-pre-wrap">{order.address ?? 'Chưa cung cấp'}</dd></div><div><dt className="text-sm text-text-muted">Ghi chú của khách</dt><dd className="whitespace-pre-wrap">{order.customerNote ?? 'Không có'}</dd></div></dl></section>
    <section aria-label="Sản phẩm tại thời điểm gửi" className={formClass}><h2 className="text-lg font-semibold text-forest-green">Sản phẩm tại thời điểm gửi</h2>
      <ul className="divide-y divide-soft-sand">{order.items.map((item, index) => <li key={index} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 break-words"><p className="font-semibold">{item.productNameSnapshot}</p><p className="text-sm">{item.variantNameSnapshot ?? 'Không có quy cách'}</p><p className="text-sm">Số lượng: {item.quantity}</p></div>
        <div className="text-sm"><p>Đơn giá: <span>{money(item.unitPrice)}</span></p><p>Thành tiền: <span>{money(item.lineTotal)}</span></p></div>
      </li>)}</ul>
      <dl className="space-y-2 border-t border-soft-sand pt-3"><div className="flex flex-wrap justify-between gap-2"><dt>Tạm tính</dt><dd>{money(order.subtotal)}</dd></div>
        <div className="flex flex-wrap justify-between gap-2"><dt>Voucher</dt><dd className="min-w-0 max-w-full break-all">{order.voucherCodeSnapshot ?? 'Không áp dụng'}</dd></div>
        {!quote && <div className="flex flex-wrap justify-between gap-2"><dt>Giảm giá</dt><dd>{money(order.discountAmount)}</dd></div>}
        <div className="flex flex-wrap justify-between gap-2 font-semibold"><dt>Tổng tiền</dt><dd>{money(order.totalAmount)}</dd></div></dl>
      {quote && <p className="text-sm text-text-muted">Yêu cầu báo giá chưa có tổng tiền; hoàn tất chỉ thể hiện đã xử lý yêu cầu, không ghi nhận doanh thu.</p>}
    </section>
    <OrderNoteForm errors={mutation.error?.fields} key={id} initialNote={order.adminNote} pending={mutation.pending}
      conflict={noteConflict} onReload={reloadNote} onReviewed={() => setNoteConflict(null)}
      onSave={(note, expected) => mutation.run(async () => {
        try { return await saveOrderNote(id, note, expected); } catch (error) {
          if (error instanceof ApiClientError && error.code === 'NOTE_CONFLICT') {
            setNoteConflict({ phase: 'loading' });
            try {
              const saved = await execute(load); resource.setData(saved); setNoteConflict({ phase: 'ready', note: saved.adminNote });
            } catch { setNoteConflict({ phase: 'failed' }); }
          }
          throw error;
        }
      }, resource.setData, 'Đã lưu ghi chú.')} />
  </div>;
}
