'use client';

import { useId, useState } from 'react';
import type { CategoryDto, ProductDto, ProductStatus, SaleType } from '@/lib/api/contracts/types';
import { saveProduct, getProduct, listProducts } from './catalog-admin-api';
import { FormFeedback, TextField, fieldClass, formClass, optionalText, sortOrder, useAdminMutation } from './form-support';
import { ProductImagesEditor } from './ProductImagesEditor';
import { ApiClientError } from '@/lib/api/client';
import { useAdminSession } from '../AdminSessionProvider';
import { actionClass, errorMessage } from './form-support';

export function ProductForm({ product, categories, onSaved }: { product?: ProductDto; categories: CategoryDto[]; onSaved: (product: ProductDto) => void }) {
  const prefix = useId();
  const { execute } = useAdminSession();
  const [recovery, setRecovery] = useState<'conflict' | 'unknown' | null>(null);
  const [reviewed, setReviewed] = useState<{ product: ProductDto | null } | null>(null);
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [saveId, setSaveId] = useState(product?.id);
  const [attemptedSlug, setAttemptedSlug] = useState('');
  const [revision, setRevision] = useState(product?.imagesRevision ?? 0);
  const mutation = useAdminMutation((error) => {
    if (error instanceof ApiClientError && error.code === 'IMAGE_CONFLICT') return 'Ảnh sản phẩm đã thay đổi. Tải phiên bản đã lưu để đối chiếu; bản nháp vẫn được giữ.';
    if (!(error instanceof ApiClientError) || error.status >= 500) return 'Không lưu được. Chưa xác định kết quả lưu; tải phiên bản đã lưu để đối chiếu trước khi thử lại.';
    return errorMessage(error);
  });
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(product?.thumbnailUrl ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images?.length ? product.images.map((image) => image.url) : product?.thumbnailUrl ? [product.thumbnailUrl] : []);
  const [saleType, setSaleType] = useState<SaleType>(product?.saleType ?? 'FIXED_PRICE');
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'ACTIVE');
  const [order, setOrder] = useState(String(product?.sortOrder ?? 0));
  const [uploading, setUploading] = useState(false);
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault();
    if (uploading || recovery || reviewPending) return;
    setAttemptedSlug(slug.trim().toLowerCase());
    void mutation.run(async () => {
      const body = { categoryId, name: name.trim(), slug: slug.trim(), shortDescription: optionalText(shortDescription), description: optionalText(description), thumbnailUrl: optionalText(thumbnailUrl), saleType, status, sortOrder: sortOrder(order), imageUrls, ...(saveId ? { expectedImagesRevision: revision } : {}) };
      try {
        const saved = await saveProduct(body, saveId);
        if (!saved?.id) throw new Error('Invalid save response');
        return saved;
      } catch (error) {
        if (error instanceof ApiClientError && error.code === 'IMAGE_CONFLICT') setRecovery('conflict');
        else if (!(error instanceof ApiClientError) || error.status >= 500) setRecovery('unknown');
        throw error;
      }
    }, (saved) => { setRevision(saved.imagesRevision ?? revision); onSaved(saved); });
  }}>
    <h2 className="text-lg font-semibold text-forest-green">{product ? 'Thông tin sản phẩm' : 'Tạo sản phẩm'}</h2>
    <FormFeedback mutation={mutation} prefix={prefix} />
    {(!product || !product.variants.some((variant) => variant.isActive)) && <p className="rounded-lg bg-warm-cream p-3 text-sm text-text-muted">Chưa có quy cách đang bán. Sản phẩm chỉ xuất hiện ở cửa hàng khi danh mục, sản phẩm và ít nhất một quy cách đều hoạt động.</p>}
    {recovery && <section aria-label="Đối chiếu kết quả lưu" className="space-y-3 rounded-lg border border-soft-sand p-3">
      <p className="text-sm">Bản nháp được giữ nguyên. Hãy đọc phiên bản đã lưu trước khi quyết định.</p>
      <button type="button" className={actionClass} disabled={reviewPending || uploading || mutation.pending} onClick={async () => {
        setReviewPending(true); setReviewError(null); setReviewed(null);
        try {
          const current = await execute(() => saveId ? getProduct(saveId) : listProducts().then((items) => items.find((item) => item.slug === attemptedSlug) ?? null));
          setReviewed({ product: current });
        } catch { setReviewError('Không tải được phiên bản đã lưu. Bản nháp vẫn được giữ.'); }
        finally { setReviewPending(false); }
      }}>{reviewPending ? 'Đang đối chiếu…' : 'Tải phiên bản đã lưu để đối chiếu'}</button>
      {reviewError && <p role="alert">{reviewError}</p>}
      {reviewed && <div className="space-y-3">
        {reviewed.product ? <><p>Đã lưu: {reviewed.product.name} — {reviewed.product.images?.length ?? 0} ảnh.</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify({ name: reviewed.product.name, slug: reviewed.product.slug, description: reviewed.product.description, thumbnailUrl: reviewed.product.thumbnailUrl, imageUrls: reviewed.product.images?.map((image) => image.url) ?? [] }, null, 2)}</pre></> : <p>Chưa có sản phẩm với slug của lượt lưu vừa rồi.</p>}
        <button type="button" className={actionClass} disabled={uploading || mutation.pending} onClick={() => {
          if (uploading || mutation.pending) return;
          setRevision(reviewed.product?.imagesRevision ?? 0); setSaveId(reviewed.product?.id ?? saveId); setRecovery(null); setReviewed(null);
        }}>Giữ bản nháp và cho phép lưu lại</button>
        {reviewed.product && <button type="button" className={actionClass} disabled={uploading || mutation.pending} onClick={() => {
          if (uploading || mutation.pending) return;
          const current = reviewed.product!;
          setName(current.name); setSlug(current.slug); setCategoryId(current.categoryId); setShortDescription(current.shortDescription ?? ''); setDescription(current.description ?? '');
          setThumbnailUrl(current.thumbnailUrl ?? ''); setImageUrls(current.images?.map((image) => image.url) ?? []); setRevision(current.imagesRevision ?? 0);
          setSaleType(current.saleType); setStatus(current.status); setOrder(String(current.sortOrder)); setSaveId(current.id); setRecovery(null); setReviewed(null); onSaved(current);
        }}>Dùng phiên bản đã lưu</button>}
      </div>}
    </section>}
    <fieldset disabled={mutation.pending || uploading || reviewPending || !!recovery} className="min-w-0 space-y-4">
      <label className="block text-sm font-medium text-forest-green">Danh mục
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className={fieldClass}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (đang ẩn)'}</option>)}</select>
      </label>
      <TextField label="Tên sản phẩm" name="name" value={name} onChange={setName} prefix={prefix} errors={mutation.error?.fields} required maxLength={150} />
      <TextField label="Slug sản phẩm" name="slug" value={slug} onChange={setSlug} prefix={prefix} errors={mutation.error?.fields} required maxLength={180} />
      <label className="block text-sm font-medium text-forest-green">Loại bán
        <select value={saleType} disabled={!!saveId} onChange={(event) => setSaleType(event.target.value as SaleType)} className={fieldClass}><option value="FIXED_PRICE">Giá cố định</option><option value="QUOTE">Liên hệ báo giá</option></select>
      </label>
      {product && <p className="text-sm text-text-muted">Loại bán đã được cố định khi tạo sản phẩm.</p>}
      <TextField label="Mô tả ngắn" name="shortDescription" value={shortDescription} onChange={setShortDescription} prefix={prefix} errors={mutation.error?.fields} type="textarea" />
      <TextField label="Mô tả sản phẩm" name="description" value={description} onChange={setDescription} prefix={prefix} errors={mutation.error?.fields} type="textarea" />
      <label className="block text-sm font-medium text-forest-green">URL ảnh đại diện
        <input id={`${prefix}-thumbnailUrl`} type="url" value={thumbnailUrl} readOnly className={fieldClass} />
      </label>
      <div id={`${prefix}-imageUrls`}><ProductImagesEditor urls={imageUrls} cover={thumbnailUrl} onChange={(urls, cover) => { setImageUrls(urls); setThumbnailUrl(cover ?? ''); }} onPendingChange={setUploading} /></div>
      <TextField label="Thứ tự" name="sortOrder" value={order} onChange={setOrder} prefix={prefix} errors={mutation.error?.fields} type="number" step="1" required />
      <label className="block text-sm font-medium text-forest-green">Trạng thái sản phẩm<select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} className={fieldClass}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Đang ẩn</option></select></label>
      <button disabled={mutation.pending || uploading || !!recovery || reviewPending || !categoryId} className="btn-action-touch fixed-flow" type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>
    </fieldset>
  </form>;
}
