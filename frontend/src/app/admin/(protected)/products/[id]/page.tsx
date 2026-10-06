'use client';

import { use, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeleteProductButton } from '@/features/admin/catalog/DeleteProductButton';
import { getProduct, listCategories } from '@/features/admin/catalog/catalog-admin-api';
import { ProductForm } from '@/features/admin/catalog/ProductForm';
import { VariantEditor } from '@/features/admin/catalog/VariantEditor';
import { useAdminResource } from '@/features/admin/catalog/use-admin-resource';
import { actionClass } from '@/features/admin/catalog/form-support';
import type { VariantDto } from '@/lib/api/contracts/types';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const load = useCallback(async () => ({ product: await getProduct(id), categories: await listCategories() }), [id]);
  const resource = useAdminResource(load);
  const [newVariant, setNewVariant] = useState(0);
  const saveVariant = (variant: VariantDto) => resource.setData((current) => current && ({ ...current, product: { ...current.product, variants: current.product.variants.some((entry) => entry.id === variant.id)
    ? current.product.variants.map((entry) => entry.id === variant.id ? variant : entry) : [...current.product.variants, variant] } }));
  if (!resource.data) return <div>{resource.error ? <div role="alert">Không tải được sản phẩm. <button className={actionClass} onClick={() => void resource.reload()}>Thử lại</button></div> : <p role="status">Đang tải sản phẩm…</p>}</div>;
  const { product, categories } = resource.data;
  return <div className="space-y-6">
    <Link href="/admin/products" className="text-sm text-forest-green underline">← Danh sách sản phẩm</Link>
    <h1 className="text-2xl font-semibold text-forest-green">Sửa sản phẩm: {product.name}</h1>
    <ProductForm key={product.id} product={product} categories={categories} onSaved={(saved) => resource.setData((current) => current && ({ ...current, product: { ...saved, variants: current.product.variants } }))} />
    <DeleteProductButton id={product.id} name={product.name} onDeleted={() => router.push('/admin/products')} />
    <section className="space-y-4" aria-label="Quy cách sản phẩm">
      <h2 className="text-xl font-semibold text-forest-green">Quy cách sản phẩm</h2>
      {product.variants.map((variant) => <VariantEditor key={variant.id} product={product} variant={variant} onSaved={saveVariant} />)}
      <VariantEditor key={`new-${newVariant}`} product={product} onSaved={(variant) => { saveVariant(variant); setNewVariant((current) => current + 1); }} />
    </section>
  </div>;
}
