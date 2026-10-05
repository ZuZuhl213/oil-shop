'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAdminSession } from '../AdminSessionProvider';
import { uploadThumbnail } from './catalog-admin-api';
import { actionClass } from './form-support';

export function ProductImagesEditor({ urls, cover, onChange, onPendingChange }: {
  urls: string[]; cover: string; onChange: (urls: string[], cover: string | null) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { execute } = useAdminSession();
  const [files, setFiles] = useState<File[]>([]);
  const [failed, setFailed] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  async function upload(selected: File[]) {
    if (busy.current || !selected.length) return;
    if (urls.length + selected.length > 10) { setError('Mỗi sản phẩm có tối đa 10 ảnh.'); return; }
    busy.current = true; setPending(true); onPendingChange?.(true); setError(null); setMessage(null);
    const next = [...urls]; let nextCover = cover; const failures: File[] = [];
    try {
      for (const file of selected) {
        if (!active.current) break;
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { failures.push(file); continue; }
        try {
          const result = await execute(() => uploadThumbnail(file));
          if (!result?.url) throw new Error('Invalid upload response');
          if (!active.current) break;
          if (!next.includes(result.url)) next.push(result.url);
          nextCover ||= result.url;
          onChange([...next], nextCover);
        } catch { failures.push(file); }
      }
      if (active.current) {
        setFiles([]); setFailed(failures);
        if (failures.length) setError(`Không tải được: ${failures.map((file) => file.name).join(', ')}. Dùng JPEG, PNG hoặc WebP tối đa 5 MiB. Các ảnh đã tải thành công vẫn được giữ.`);
        if (next.length > urls.length) setMessage('Đã tải ảnh lên. Hãy lưu sản phẩm để áp dụng.');
      }
    } finally {
      busy.current = false;
      if (active.current) { setPending(false); onPendingChange?.(false); }
    }
  }
  function remove(index: number) {
    const next = urls.filter((_, i) => i !== index);
    onChange(next, next.includes(cover) ? cover : next[0] ?? null);
  }
  function move(index: number, direction: number) {
    const next = [...urls]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next, cover || null);
  }
  return <section aria-label="Ảnh sản phẩm" className="space-y-3 rounded-lg border border-soft-sand p-3">
    <label className="block text-sm font-medium text-forest-green">Chọn ảnh sản phẩm
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={pending} className="mt-2 block max-w-full text-sm" onChange={(event) => {
        setFiles(Array.from(event.target.files ?? [])); setFailed([]); setError(null); setMessage(null);
        event.target.value = '';
      }} />
    </label>
    <p className="text-xs text-text-muted">Tối đa 10 ảnh; JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB. Gỡ ảnh chỉ bỏ khỏi sản phẩm sau khi lưu.</p>
    {urls.length > 0 && <ol className="space-y-3">{urls.map((url, index) => <li key={url} className="flex flex-wrap items-center gap-2 rounded-lg border border-soft-sand p-2">
      <Image src={url} alt={`Ảnh ${index + 1} trong bản nháp`} width={96} height={96} unoptimized className="h-24 w-24 object-contain" />
      <div className="flex min-w-0 flex-wrap gap-2">
        <button type="button" className={actionClass} disabled={pending} aria-pressed={url === cover} aria-label={url === cover ? `Ảnh ${index + 1} là đại diện` : `Chọn ảnh ${index + 1} làm đại diện`} onClick={() => onChange(urls, url)}>{url === cover ? 'Ảnh đại diện' : 'Chọn đại diện'}</button>
        <button type="button" className={actionClass} disabled={pending || index === 0} aria-label={`Đưa ảnh ${index + 1} lên`} onClick={() => move(index, -1)}>Lên</button>
        <button type="button" className={actionClass} disabled={pending || index === urls.length - 1} aria-label={`Đưa ảnh ${index + 1} xuống`} onClick={() => move(index, 1)}>Xuống</button>
        <button type="button" className={actionClass} disabled={pending} aria-label={`Gỡ ảnh ${index + 1} khỏi sản phẩm`} onClick={() => remove(index)}>Gỡ ảnh</button>
      </div>
    </li>)}</ol>}
    {error && <p role="alert" className="text-sm text-error-crimson">{error}</p>}
    {message && <p role="status" className="text-sm text-forest-green">{message}</p>}
    <button type="button" disabled={pending || !files.length} className={actionClass} onClick={() => void upload(files)}>{pending ? 'Đang tải ảnh…' : 'Tải ảnh lên'}</button>
    {failed.length > 0 && <button type="button" disabled={pending} className={actionClass} onClick={() => void upload(failed)}>Thử lại ảnh lỗi</button>}
  </section>;
}
