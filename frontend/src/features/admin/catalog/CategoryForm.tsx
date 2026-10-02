'use client';

import { useId, useState } from 'react';
import type { CategoryDto } from '@/lib/api/contracts/types';
import { saveCategory } from './catalog-admin-api';
import { FormFeedback, TextField, formClass, optionalText, sortOrder, useAdminMutation } from './form-support';

export function CategoryForm({ category, onSaved }: { category?: CategoryDto; onSaved: (category: CategoryDto) => void }) {
  const prefix = useId();
  const mutation = useAdminMutation();
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [order, setOrder] = useState(String(category?.sortOrder ?? 0));
  const [active, setActive] = useState(category?.isActive ?? true);
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault();
    void mutation.run(async () => saveCategory({ name: name.trim(), slug: slug.trim(), description: optionalText(description), sortOrder: sortOrder(order), isActive: active }, category?.id), onSaved);
  }}>
    <h2 className="text-lg font-semibold text-forest-green">{category ? 'Sửa danh mục' : 'Tạo danh mục'}</h2>
    <FormFeedback mutation={mutation} prefix={prefix} />
    <fieldset disabled={mutation.pending} className="min-w-0 space-y-4">
      <TextField label="Tên danh mục" name="name" value={name} onChange={setName} prefix={prefix} errors={mutation.error?.fields} required maxLength={100} />
      <TextField label="Slug" name="slug" value={slug} onChange={setSlug} prefix={prefix} errors={mutation.error?.fields} required maxLength={120} />
      <TextField label="Mô tả danh mục" name="description" value={description} onChange={setDescription} prefix={prefix} errors={mutation.error?.fields} type="textarea" maxLength={10000} />
      <TextField label="Thứ tự" name="sortOrder" value={order} onChange={setOrder} prefix={prefix} errors={mutation.error?.fields} type="number" step="1" required />
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Danh mục hoạt động</label>
      <button disabled={mutation.pending} className="btn-action-touch fixed-flow" type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu danh mục'}</button>
    </fieldset>
  </form>;
}
