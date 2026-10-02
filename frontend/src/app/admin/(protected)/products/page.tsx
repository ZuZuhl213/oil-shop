'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/features/admin/catalog/ProductForm';
import { listCategories, listProducts, setProductActive } from '@/features/admin/catalog/catalog-admin-api';
import { useAdminResource } from '@/features/admin/catalog/use-admin-resource';
import { actionClass, FormFeedback, useAdminMutation } from '@/features/admin/catalog/form-support';

const load = async () => ({ products: await listProducts(), categories: await listCategories() });
export default function ProductsPage() {
  const resource = useAdminResource(load);
  const mutation = useAdminMutation();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const products = resource.data?.products.filter((entry) => `${entry.name} ${entry.slug}`.toLocaleLowerCase('vi').includes(keyword.toLocaleLowerCase('vi')) && (status === 'all' || entry.status === status) && (!categoryId || entry.categoryId === categoryId));
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-forest-green">Sản phẩm</h1><button className={actionClass} disabled={!resource.data} onClick={() => setCreating(true)}>Tạo sản phẩm</button></div>
    <FormFeedback mutation={mutation} prefix="products" />
    {resource.error && <div role="alert">Không tải được sản phẩm. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></div>}
    {resource.pending && <p role="status">Đang tải sản phẩm…</p>}
    {resource.data && <>
      {creating && (resource.data.categories.length === 0 ? <p>Tạo danh mục trước khi tạo sản phẩm.</p> : <><ProductForm categories={resource.data.categories} onSaved={(saved) => router.push('/admin/products/' + encodeURIComponent(saved.id))} /><button className={actionClass} onClick={() => setCreating(false)}>Đóng form</button></>)}
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Tìm sản phẩm<input className="ml-2 min-h-11 max-w-full rounded-lg border border-soft-sand px-3" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></label>
        <label className="text-sm">Lọc trạng thái<select className="ml-2 min-h-11 rounded-lg border border-soft-sand px-3" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Đang ẩn</option></select></label>
        <label className="text-sm">Lọc danh mục<select className="ml-2 min-h-11 rounded-lg border border-soft-sand px-3" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Tất cả</option>{resource.data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </div>
      {products?.length === 0 && <p>Không có sản phẩm phù hợp.</p>}
      <ul className="space-y-3">{products?.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soft-sand bg-white-pure p-4">
        <div><Link className="font-semibold text-forest-green underline" href={'/admin/products/' + encodeURIComponent(entry.id)}>{entry.name}</Link><p className="text-sm text-text-muted">{entry.saleType === 'QUOTE' ? 'Báo giá' : 'Giá cố định'} · {entry.status === 'ACTIVE' ? 'Hoạt động' : 'Đang ẩn'} · {entry.variants.filter((variant) => variant.isActive).length} quy cách đang bán</p></div>
        <button disabled={mutation.pending} className={actionClass} aria-label={`${entry.status === 'ACTIVE' ? 'Ẩn' : 'Kích hoạt'} ${entry.name}`} onClick={() => void mutation.run(() => setProductActive(entry.id, entry.status !== 'ACTIVE'), (saved) => resource.setData((current) => current && ({ ...current, products: current.products.map((item) => item.id === saved.id ? saved : item) })), 'Đã cập nhật trạng thái sản phẩm.')}>{entry.status === 'ACTIVE' ? 'Ẩn' : 'Kích hoạt'}</button>
      </li>)}</ul>
    </>}
  </div>;
}
