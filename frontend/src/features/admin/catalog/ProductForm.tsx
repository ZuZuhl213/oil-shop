'use client';

import { useId, useState } from 'react';
import type { CategoryDto, ProductDto, ProductStatus, SaleType } from '@/lib/api/contracts/types';
import { saveProduct } from './catalog-admin-api';
import { FormFeedback, TextField, fieldClass, formClass, optionalText, sortOrder, useAdminMutation } from './form-support';
import { ThumbnailUpload } from './ThumbnailUpload';

export function ProductForm({ product, categories, onSaved }: { product?: ProductDto; categories: CategoryDto[]; onSaved: (product: ProductDto) => void }) {
  const prefix = useId();
  const mutation = useAdminMutation();
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl ?? '');
  const [saleType, setSaleType] = useState<SaleType>(product?.saleType ?? 'FIXED_PRICE');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'ACTIVE');
  const [order, setOrder] = useState(String(product?.sortOrder ?? 0));
  const [uploading, setUploading] = useState(false);
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault();
    if (uploading) return;
    void mutation.run(async () => saveProduct({ categoryId, name: name.trim(), slug: slug.trim(), shortDescription: optionalText(shortDescription), description: optionalText(description), thumbnailUrl: optionalText(thumbnailUrl), saleType, status, sortOrder: sortOrder(order) }, product?.id), onSaved);
  }}>
    <h2 className="text-lg font-semibold text-forest-green">{product ? 'Thông tin sản phẩm' : 'Tạo sản phẩm'}</h2>
    <FormFeedback mutation={mutation} prefix={prefix} />
    {(!product || !product.variants.some((variant) => variant.isActive)) && <p className="rounded-lg bg-warm-cream p-3 text-sm text-text-muted">Chưa có quy cách đang bán. Sản phẩm chỉ xuất hiện ở cửa hàng khi danh mục, sản phẩm và ít nhất một quy cách đều hoạt động.</p>}
    <fieldset disabled={mutation.pending || uploading} className="min-w-0 space-y-4">
      <label className="block text-sm font-medium text-forest-green">Danh mục
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className={fieldClass}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (đang ẩn)'}</option>)}</select>
      </label>
      <TextField label="Tên sản phẩm" name="name" value={name} onChange={setName} prefix={prefix} errors={mutation.error?.fields} required maxLength={150} />
      <TextField label="Slug sản phẩm" name="slug" value={slug} onChange={setSlug} prefix={prefix} errors={mutation.error?.fields} required maxLength={180} />
      <label className="block text-sm font-medium text-forest-green">Loại bán
        <select value={saleType} disabled={!!product} onChange={(event) => setSaleType(event.target.value as SaleType)} className={fieldClass}><option value="FIXED_PRICE">Giá cố định</option><option value="QUOTE">Liên hệ báo giá</option></select>
      </label>
      {product && <p className="text-sm text-text-muted">Loại bán đã được cố định khi tạo sản phẩm.</p>}
      <TextField label="Mô tả ngắn" name="shortDescription" value={shortDescription} onChange={setShortDescription} prefix={prefix} errors={mutation.error?.fields} type="textarea" />
      <TextField label="Mô tả sản phẩm" name="description" value={description} onChange={setDescription} prefix={prefix} errors={mutation.error?.fields} type="textarea" />
      <TextField label="URL ảnh đại diện" name="thumbnailUrl" value={thumbnailUrl} onChange={setThumbnailUrl} prefix={prefix} errors={mutation.error?.fields} type="url" />
      <ThumbnailUpload url={thumbnailUrl} onUploaded={setThumbnailUrl} onPendingChange={setUploading} />
      <TextField label="Thứ tự" name="sortOrder" value={order} onChange={setOrder} prefix={prefix} errors={mutation.error?.fields} type="number" step="1" required />
      <label className="block text-sm font-medium text-forest-green">Trạng thái sản phẩm<select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} className={fieldClass}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Đang ẩn</option></select></label>
      <button disabled={mutation.pending || uploading || !categoryId} className="btn-action-touch fixed-flow" type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>
    </fieldset>
  </form>;
}
