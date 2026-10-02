'use client';

import { useState } from 'react';
import { CategoryForm } from '@/features/admin/catalog/CategoryForm';
import { listCategories, setCategoryActive } from '@/features/admin/catalog/catalog-admin-api';
import { useAdminResource } from '@/features/admin/catalog/use-admin-resource';
import { actionClass, FormFeedback, useAdminMutation } from '@/features/admin/catalog/form-support';

export default function CategoriesPage() {
  const resource = useAdminResource(listCategories);
  const mutation = useAdminMutation();
  const [editing, setEditing] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const category = resource.data?.find((entry) => entry.id === editing);
  const filtered = resource.data?.filter((entry) => `${entry.name} ${entry.slug}`.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')) && (status === 'all' || entry.isActive === (status === 'active')));
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-forest-green">Danh mục</h1><button className={actionClass} onClick={() => setEditing('new')}>Tạo danh mục</button></div>
    <FormFeedback mutation={mutation} prefix="categories" />
    {resource.error && <div role="alert">Không tải được danh mục. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></div>}
    {resource.pending && <p role="status">Đang tải danh mục…</p>}
    {editing && <div className="space-y-2"><CategoryForm key={editing} category={category} onSaved={(saved) => {
      resource.setData((current) => current?.some((entry) => entry.id === saved.id) ? current.map((entry) => entry.id === saved.id ? saved : entry) : [...(current ?? []), saved]);
      setEditing(saved.id);
    }} /><button className={actionClass} onClick={() => setEditing(null)}>Đóng form</button></div>}
    {resource.data && <>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Tìm danh mục<input className="ml-2 min-h-11 max-w-full rounded-lg border border-soft-sand px-3" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></label>
        <label className="text-sm">Lọc trạng thái<select className="ml-2 min-h-11 rounded-lg border border-soft-sand px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả</option><option value="active">Hoạt động</option><option value="inactive">Đang ẩn</option></select></label>
      </div>
      {filtered?.length === 0 && <p>Không có danh mục phù hợp.</p>}
      <ul className="space-y-3">{filtered?.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soft-sand bg-white-pure p-4">
        <div><h2 className="font-semibold">{entry.name}</h2><p className="text-sm text-text-muted">{entry.slug} · {entry.isActive ? 'Hoạt động' : 'Đang ẩn'}</p></div>
        <div className="flex gap-2"><button className={actionClass} aria-label={`Sửa ${entry.name}`} onClick={() => setEditing(entry.id)}>Sửa</button><button disabled={mutation.pending || editing === entry.id} className={actionClass} aria-label={`${entry.isActive ? 'Ẩn' : 'Kích hoạt'} ${entry.name}`} onClick={() => void mutation.run(() => setCategoryActive(entry.id, !entry.isActive), (saved) => resource.setData((current) => current?.map((item) => item.id === saved.id ? saved : item) ?? null), 'Đã cập nhật trạng thái danh mục.')}>{entry.isActive ? 'Ẩn' : 'Kích hoạt'}</button></div>
      </li>)}</ul>
    </>}
  </div>;
}
