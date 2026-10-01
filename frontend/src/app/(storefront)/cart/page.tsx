'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { useCart, type CartItem } from '@/context/CartContext';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { getProductBySlug } from '@/lib/api/products';
import type { ProductDto } from '@/lib/api/contracts/types';
import { isQuantityValid } from '@/features/cart/cart-store';

function formatQuantity(quantity: number): string {
  return quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function QuantityInput({ item }: { item: CartItem }) {
  const { updateQuantity } = useCart();
  const [draft, setDraft] = useState<{ baseQuantity: number; value: string } | null>(null);
  const activeDraft = draft?.baseQuantity === item.quantity ? draft : null;

  return (
    <input
      type="number"
      className="h-11 w-24 rounded-lg border border-soft-sand bg-white-pure text-center text-base text-dark-cocoa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green"
      min={item.minQuantity}
      step={item.quantityStep}
      value={activeDraft?.value ?? String(item.quantity)}
      onChange={(event) => setDraft({ baseQuantity: item.quantity, value: event.currentTarget.value })}
      onBlur={() => {
        if (activeDraft) {
          const quantity = Number(activeDraft.value);
          updateQuantity(item.variantId, quantity > 0 ? quantity : Number.NaN);
        }
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      aria-label={`Số lượng ${item.productName}`}
    />
  );
}

function VariantSelect({ item, onNotice }: { item: CartItem; onNotice: (message: string | null) => void }) {
  const { changeVariant } = useCart();
  const [catalog, setCatalog] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; product: ProductDto }
  >({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!item.productSlug) return;
    let active = true;
    getProductBySlug(item.productSlug).then((product) => {
      if (active) setCatalog({ status: 'ready', product });
    }).catch(() => {
      if (active) setCatalog({ status: 'error' });
    });
    return () => { active = false; };
  }, [item.productSlug, attempt]);

  if (!item.productSlug) return null;
  if (catalog.status === 'loading') return <p className="text-sm text-text-muted" role="status">Đang tải quy cách…</p>;
  if (catalog.status === 'error') return <div className="text-sm">
    <p role="alert" className="text-error-crimson">Không tải được quy cách. Giỏ hàng vẫn giữ quy cách hiện tại.</p>
    <button type="button" className="mt-1 min-h-11 rounded-lg border border-soft-sand px-3 text-forest-green" aria-label={`Thử lại tải quy cách ${item.productName}`} onClick={() => {
      setCatalog({ status: 'loading' });
      setAttempt((current) => current + 1);
    }}>Thử lại</button>
  </div>;

  const variants = catalog.product.variants.filter((variant) => variant.isActive);
  const currentIsActive = variants.some((variant) => variant.id === item.variantId);
  if (variants.length === 0 || (variants.length === 1 && currentIsActive)) return null;
  return <label className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
    Đổi quy cách
    <select aria-label={`Quy cách ${item.productName}`} value={currentIsActive ? item.variantId : ''} onChange={(event) => {
      const variant = variants.find((entry) => entry.id === event.currentTarget.value);
      if (!variant || variant.id === item.variantId) return;
      onNotice(null);
      const keepsQuantity = isQuantityValid(item.quantity, variant.minQuantity, variant.quantityStep);
      const result = changeVariant(item.variantId, {
        ...item, variantId: variant.id, variantName: variant.name, price: variant.price,
        saleType: catalog.product.saleType,
        minQuantity: variant.minQuantity, quantityStep: variant.quantityStep, quantity: variant.minQuantity,
      });
      if (result.ok) onNotice(keepsQuantity
        ? `Đã đổi quy cách sang ${variant.name}, giữ số lượng ${formatQuantity(item.quantity)}.`
        : `Đã đổi quy cách sang ${variant.name}. Số lượng ${formatQuantity(item.quantity)} không phù hợp với mức tối thiểu ${formatQuantity(variant.minQuantity)} và bước ${formatQuantity(variant.quantityStep)}; đã đặt về mức tối thiểu ${formatQuantity(variant.minQuantity)}.`);
    }} className="max-w-full rounded-lg border border-soft-sand bg-white-pure px-2 py-1 text-dark-cocoa">
      {!currentIsActive && <option value="" disabled>Chọn quy cách thay thế</option>}
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
    </select>
  </label>;
}

export default function CartPage() {
  const [variantNotice, setVariantNotice] = useState<string | null>(null);
  const {
    items,
    saleType,
    subtotal,
    totalItems,
    isHydrated,
    storageMessage,
    actionError,
    removeItem,
    updateQuantity,
  } = useCart();
  const isQuote = saleType === 'QUOTE';

  if (!isHydrated) {
    return <div className="site-container py-20 text-center text-text-muted" role="status">Đang tải giỏ hàng…</div>;
  }

  if (items.length === 0) {
    return (
      <section className="site-container mx-auto max-w-3xl py-16 text-center sm:py-24">
        <p className="section-eyebrow">HM NATURALS</p>
        <h1 className="section-title mt-2">Giỏ hàng đang trống</h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-text-muted">
          Chọn quy cách sản phẩm để bắt đầu đặt hàng hoặc gửi yêu cầu báo giá.
        </p>
        {storageMessage && <p className="mt-5 rounded-xl border border-soft-sand bg-white-pure p-3 text-sm text-text-muted" role="status">{storageMessage}</p>}
        <Link href="/products" className="btn-action-touch fixed-flow mt-6">Xem sản phẩm</Link>
      </section>
    );
  }

  return (
    <section className="site-container py-6 pb-16 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">{isQuote ? 'Yêu cầu báo giá' : 'Đặt hàng'}</p>
            <h1 className="section-title mt-1">Giỏ hàng</h1>
            <p className="mt-2 text-sm text-text-muted">{totalItems} sản phẩm theo quy cách đã chọn</p>
          </div>
          <Link href="/products" className="rounded-full border border-soft-sand bg-white-pure px-5 py-3 text-sm font-semibold text-forest-green hover:bg-peanut-gold-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green">
            Tiếp tục xem sản phẩm
          </Link>
        </div>

        {storageMessage && <p className="mb-4 rounded-xl border border-soft-sand bg-white-pure p-3 text-sm text-text-muted" role="status">{storageMessage}</p>}
        {actionError && <div className="mb-4 rounded-xl border border-error-crimson bg-white-pure p-3 text-sm text-error-crimson" role="alert">{actionError.message}</div>}
        {variantNotice && <p className="mb-4 rounded-xl border border-soft-sand bg-white-pure p-3 text-sm text-text-muted" role="status">{variantNotice}</p>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            {items.map((item) => {
              const atMinimum = Math.abs(item.quantity - item.minQuantity) < 0.000001;
              return (
                <article key={item.variantId} className="flex min-w-0 items-center gap-3 rounded-2xl border border-soft-sand bg-white-pure p-3 sm:gap-5 sm:p-5">
                  <div className="order-item-thumb h-16 w-16 overflow-hidden rounded-xl bg-warm-cream sm:h-20 sm:w-20">
                    <ProductBottleImage type={item.thumbnailType ?? 'peanut'} alt={item.productName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-forest-green">{item.productName}</h2>
                    <p className="mt-1 text-sm text-text-muted">Quy cách: {item.variantName}</p>
                    <div className="mt-2"><VariantSelect item={item} onNotice={setVariantNotice} /></div>
                    <p className="mt-1 text-sm font-semibold text-dark-cocoa">
                      {item.price == null ? 'Shop sẽ báo giá sau khi liên hệ' : `${formatCurrencyVnd(item.price)} / quy cách`}
                    </p>
                    {item.price != null && <p className="mt-1 text-sm text-text-muted">Tạm tính dòng hàng: {formatCurrencyVnd(item.price * item.quantity)}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="od-touch inline-flex items-center justify-center rounded-full border border-soft-sand text-lg text-forest-green disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green"
                        onClick={() => updateQuantity(item.variantId, Math.max(item.minQuantity, Number((item.quantity - item.quantityStep).toFixed(2))))}
                        disabled={atMinimum}
                        aria-label={`Giảm số lượng ${item.productName}`}
                      >−</button>
                      <QuantityInput item={item} />
                      <button
                        type="button"
                        className="od-touch inline-flex items-center justify-center rounded-full border border-soft-sand text-lg text-forest-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green"
                        onClick={() => updateQuantity(item.variantId, Number((item.quantity + item.quantityStep).toFixed(2)))}
                        aria-label={`Tăng số lượng ${item.productName}`}
                      >+</button>
                      <span className="text-xs text-text-muted">Tối thiểu {formatQuantity(item.minQuantity)}, bước {formatQuantity(item.quantityStep)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="od-touch shrink-0 rounded-full px-2 text-sm font-medium text-error-crimson hover:bg-warm-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-crimson"
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
                  >Xóa</button>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border border-soft-sand bg-white-pure p-5 lg:sticky lg:top-28">
            <h2 className="text-lg font-semibold text-forest-green">Tóm tắt</h2>
            {isQuote ? (
              <p className="mt-3 text-sm leading-6 text-text-muted">Sản phẩm báo giá chưa có giá cố định. Shop sẽ liên hệ để xác nhận quy cách và mức giá.</p>
            ) : (
              <div className="mt-4 flex items-start justify-between gap-4 border-t border-soft-sand-light pt-4 text-sm">
                <span className="text-text-muted">Tạm tính ước lượng</span>
                <strong className="text-right tabular-nums text-dark-cocoa">{formatCurrencyVnd(subtotal)}</strong>
              </div>
            )}
            <p className="mt-3 text-xs leading-5 text-text-muted">Phí giao nhận và thông tin cuối cùng sẽ được shop xác nhận qua điện thoại. Chưa có thanh toán trực tuyến.</p>
            <Link href="/checkout" className="btn-action-touch fixed-flow mt-5 w-full">
              {isQuote ? 'Gửi yêu cầu báo giá' : 'Tiếp tục đặt hàng'}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
