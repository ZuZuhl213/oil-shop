'use client';
import { useState } from 'react';
import { TextField, formClass } from '../catalog/form-support';
export function OrderNoteForm({ initialNote, pending, onSave, errors }: { initialNote: string | null; pending: boolean; onSave: (note: string | null) => Promise<boolean>; errors?: Record<string, string> }) {
  const serverNote = initialNote ?? '';
  const [draft, setDraft] = useState({ note: serverNote, saved: serverNote });
  // Refresh clean notes, but keep local edits while updating their server baseline.
  if (draft.saved !== serverNote) setDraft({ saved: serverNote, note: draft.note === draft.saved ? serverNote : draft.note });
  const prefix = 'order';
  return <form className={formClass} onSubmit={async (event) => {
    event.preventDefault(); if (pending) return;
    const note = draft.note.trim();
    if (await onSave(note || null)) setDraft({ note, saved: note });
  }}>
    <fieldset disabled={pending} className="min-w-0 space-y-3"><TextField label="Ghi chú quản trị" name="adminNote" type="textarea" value={draft.note} onChange={(note) => setDraft((current) => ({ ...current, note }))} prefix={prefix} maxLength={2000} errors={errors} />
    <p className="text-sm text-text-muted">Ghi chú nội bộ riêng với ghi chú của khách. Bản nháp được giữ tại trang trong phiên này; rời trang sẽ mất phần chưa lưu.</p><button className="btn-action-touch fixed-flow">Lưu ghi chú</button></fieldset>
  </form>;
}
