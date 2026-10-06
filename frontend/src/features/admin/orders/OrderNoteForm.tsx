'use client';

import { adminButtonClass } from '@/features/admin/button-styles';
import { useState } from 'react';
import { TextField, formClass, actionClass } from '../catalog/form-support';
export type NoteConflict = { phase: 'loading' | 'failed' } | { phase: 'ready'; note: string | null };
export function OrderNoteForm({ initialNote, pending, onSave, errors, conflict, onReload, onReviewed }: {
  initialNote: string | null; pending: boolean;
  onSave: (note: string | null, expectedNote: string | null) => Promise<boolean>;
  errors?: Record<string, string>; conflict: NoteConflict | null; onReload: () => void; onReviewed: () => void;
}) {
  const serverNote = initialNote ?? '';
  const [draft, setDraft] = useState({ note: serverNote, saved: serverNote });
  // A dirty draft keeps the value it originally read, including during status refreshes.
  if (!conflict && draft.note === draft.saved && draft.saved !== serverNote) setDraft({ saved: serverNote, note: serverNote });
  const prefix = 'order';
  return <form className={formClass} onSubmit={async (event) => {
    event.preventDefault(); if (pending || conflict) return;
    const note = draft.note.trim();
    if (await onSave(note || null, draft.saved || null)) setDraft({ note, saved: note });
  }}>
    <fieldset disabled={pending} className="min-w-0 space-y-3"><TextField label="Ghi chú quản trị" name="adminNote" type="textarea" value={draft.note} onChange={(note) => setDraft((current) => ({ ...current, note }))} prefix={prefix} maxLength={2000} errors={errors} />
    <p className="text-sm text-text-muted">Ghi chú nội bộ riêng với ghi chú của khách. Bản nháp được giữ tại trang trong phiên này; rời trang sẽ mất phần chưa lưu.</p>
    {conflict && <section aria-label="Xem lại xung đột ghi chú" className="space-y-3 rounded-xl border border-soft-sand p-3">
      <p>Ghi chú đã được admin khác cập nhật. Bản nháp của bạn vẫn ở ô trên; xem lại trước khi lưu.</p>
      {conflict.phase === 'loading' && <p role="status">Đang tải ghi chú mới…</p>}
      {conflict.phase === 'failed' && <><p role="alert">Chưa tải được ghi chú mới. Chưa thể lưu lại.</p><button type="button" className={actionClass} onClick={onReload}>Tải lại ghi chú</button></>}
      {conflict.phase === 'ready' && <>
        <dl className="space-y-2 break-words"><div><dt className="font-semibold">Ghi chú bạn đã đọc</dt><dd className="whitespace-pre-wrap">{draft.saved || 'Không có ghi chú'}</dd></div>
          <div><dt className="font-semibold">Ghi chú hiện tại trên hệ thống</dt><dd className="whitespace-pre-wrap">{conflict.note || 'Không có ghi chú'}</dd></div></dl>
        <button type="button" className={adminButtonClass('warning')} onClick={() => {
          setDraft((current) => ({ ...current, saved: conflict.note ?? '' })); onReviewed();
        }}>Đã xem ghi chú mới, tiếp tục chỉnh sửa</button>
        <p className="text-sm text-text-muted">Bạn có thể kết hợp nội dung mới vào bản nháp. Nhấn Lưu ghi chú khi đã quyết định thay thế nội dung hiện tại.</p>
      </>}
    </section>}
    <button disabled={!!conflict} className={adminButtonClass('primary')}>Lưu ghi chú</button></fieldset>
  </form>;
}
