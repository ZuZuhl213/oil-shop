'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useAdminSession } from '../AdminSessionProvider';
import { uploadThumbnail } from './catalog-admin-api';
import { actionClass } from './form-support';

export function ThumbnailUpload({ url, onUploaded, onPendingChange }: { url: string; onUploaded: (url: string) => void; onPendingChange?: (pending: boolean) => void }) {
  const { execute } = useAdminSession();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const busy = useRef(false);
  return <div className="space-y-3 rounded-lg border border-soft-sand p-3">
    <label className="block text-sm font-medium text-forest-green">Chọn ảnh đại diện
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} className="mt-2 block max-w-full text-sm" onChange={(event) => {
        setFile(event.target.files?.[0] ?? null); setError(null); setUploaded(false);
      }} />
    </label>
    <p className="text-xs text-text-muted">JPEG, PNG hoặc WebP; tối đa 5 MiB. Ảnh chỉ được gắn vào sản phẩm sau khi lưu thông tin.</p>
    {url && <Image src={url} alt="Ảnh đại diện trong bản nháp" width={160} height={160} unoptimized className="max-w-full rounded-lg object-contain" />}
    {error && <p role="alert" className="text-sm text-error-crimson">{error}</p>}
    {uploaded && <p role="status" className="text-sm text-forest-green">Đã tải ảnh lên. URL đang ở bản nháp; hãy lưu sản phẩm để áp dụng.</p>}
    <button type="button" disabled={!file || pending} className={actionClass} onClick={async () => {
      if (!file || busy.current) return;
      if (file.size > 5 * 1024 * 1024) { setError('Ảnh vượt quá giới hạn 5 MiB.'); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Chỉ nhận ảnh JPEG, PNG hoặc WebP.'); return; }
      busy.current = true; setPending(true); setError(null); setUploaded(false); onPendingChange?.(true);
      try {
        const result = await execute(() => uploadThumbnail(file));
        onUploaded(result.url); setUploaded(true);
      } catch { setError('Không tải ảnh lên được. Ảnh hiện tại vẫn được giữ; hãy thử lại.'); }
      finally { busy.current = false; setPending(false); onPendingChange?.(false); }
    }}>{pending ? 'Đang tải ảnh…' : error && file && file.size <= 5 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? 'Thử lại tải ảnh' : 'Tải ảnh lên'}</button>
  </div>;
}
