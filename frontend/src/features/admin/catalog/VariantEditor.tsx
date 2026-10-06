'use client';

import { adminButtonClass } from '@/features/admin/button-styles';

import { useId, useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import type { ProductDto, VariantDto } from '@/lib/api/contracts/types';
import { saveVariant, setVariantActive } from './catalog-admin-api';
import { FormFeedback, TextField, formClass, optionalText, sortOrder, useAdminMutation } from './form-support';

function quantityRule(value: string, field: string): number {
  const number = Number(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || number < 0.01 || number > 99999999.99) throw new ApiClientError(422, {
    message: 'Quy tắc số lượng không hợp lệ.', fieldErrors: { [field]: 'Từ 0.01 đến 99999999.99, tối đa 2 chữ số thập phân.' },
  });
  return number;
}

export function VariantEditor({ product, variant, onSaved }: { product: ProductDto; variant?: VariantDto; onSaved: (variant: VariantDto) => void }) {
  const prefix = useId();
  const mutation = useAdminMutation();
  const [name, setName] = useState(variant?.name ?? '');
  const [sku, setSku] = useState(variant?.sku ?? '');
  const [price, setPrice] = useState(variant?.price == null ? '' : String(variant.price));
  const [minimum, setMinimum] = useState(String(variant?.minQuantity ?? 1));
  const [step, setStep] = useState(String(variant?.quantityStep ?? 1));
  const [order, setOrder] = useState(String(variant?.sortOrder ?? 0));
  const [active, setActive] = useState(variant?.isActive ?? true);
  const quote = product.saleType === 'QUOTE';
  return <form className={formClass} onSubmit={(event) => {
    event.preventDefault();
    void mutation.run(async () => {
      const minQuantity = quantityRule(minimum, 'minQuantity');
      const quantityStep = quantityRule(step, 'quantityStep');
      const priceNumber = quote ? null : Number(price);
      if (!quote && (!/^\d+$/.test(price) || !Number.isSafeInteger(priceNumber) || priceNumber! < 0 || priceNumber! > 9000000000000)) throw new ApiClientError(422, { message: 'Giá phải là số nguyên VND từ 0 đến 9.000.000.000.000.', fieldErrors: { price: 'Nhập số tiền nguyên VND hợp lệ.' } });
      if (priceNumber != null && [minQuantity, quantityStep].some((quantity) => (BigInt(priceNumber) * BigInt(Math.round(quantity * 100))) % BigInt(100) !== BigInt(0))) throw new ApiClientError(422, { message: 'Giá nhân với mức tối thiểu và bước số lượng phải cho số VND nguyên.', fieldErrors: { price: 'Giá chưa tương thích với quy tắc số lượng.' } });
      return saveVariant(product.id, { name: name.trim(), sku: optionalText(sku), price: priceNumber, minQuantity, quantityStep, sortOrder: sortOrder(order), isActive: active }, variant?.id);
    }, onSaved);
  }}>
    <h3 className="font-semibold text-forest-green">{variant ? `Quy cách: ${variant.name}` : 'Thêm quy cách'}</h3>
    <FormFeedback mutation={mutation} prefix={prefix} />
    <fieldset disabled={mutation.pending} className="min-w-0 space-y-4">
      <TextField label="Tên quy cách" name="name" value={name} onChange={setName} prefix={prefix} errors={mutation.error?.fields} required maxLength={100} />
      <TextField label="SKU" name="sku" value={sku} onChange={setSku} prefix={prefix} errors={mutation.error?.fields} maxLength={50} />
      {quote ? <p className="text-sm text-text-muted">Quy cách báo giá không có giá cố định.</p> : <TextField label="Giá (VND)" name="price" value={price} onChange={setPrice} prefix={prefix} errors={mutation.error?.fields} type="number" min={0} step="1" required />}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Số lượng tối thiểu" name="minQuantity" value={minimum} onChange={setMinimum} prefix={prefix} errors={mutation.error?.fields} type="number" min={0.01} step="0.01" required />
        <TextField label="Bước số lượng" name="quantityStep" value={step} onChange={setStep} prefix={prefix} errors={mutation.error?.fields} type="number" min={0.01} step="0.01" required />
      </div>
      <p className="text-sm text-text-muted">Ví dụ: chai dùng 1 / 1; hàng theo cân có thể dùng 0.5 / 0.5. Số lượng từ mức tối thiểu, tăng theo bước quy định.</p>
      <TextField label="Thứ tự quy cách" name="sortOrder" value={order} onChange={setOrder} prefix={prefix} errors={mutation.error?.fields} type="number" step="1" required />
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Đang bán</label>
      <button disabled={mutation.pending} className={adminButtonClass('primary')} type="submit">{mutation.pending ? 'Đang lưu…' : 'Lưu quy cách'}</button>
      {variant && <button type="button" disabled={mutation.pending} className={`${adminButtonClass(variant.isActive ? 'danger' : 'success')} ml-2`} onClick={() => void mutation.run(() => setVariantActive(variant.id, !variant.isActive), (saved) => { setActive(saved.isActive); onSaved(saved); }, 'Đã cập nhật trạng thái quy cách.')}>{variant.isActive ? 'Ẩn quy cách' : 'Kích hoạt quy cách'}</button>}
    </fieldset>
  </form>;
}
