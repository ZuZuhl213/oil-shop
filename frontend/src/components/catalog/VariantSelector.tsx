"use client";

import { useState } from "react";
import type { Product, Variant } from "@/lib/api-types";
import { formatVnd } from "./catalog-ui";

interface VariantSelectorProps {
  product: Product;
  onChange: (variant: Variant | null) => void;
}

export function VariantSelector({ product, onChange }: VariantSelectorProps) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const [selected, setSelected] = useState<Variant | null>(activeVariants[0] ?? null);

  function selectVariant(id: string) {
    const next = activeVariants.find((variant) => variant.id === id) ?? null;
    setSelected(next);
    onChange(next);
  }

  const quote = product.saleType === "QUOTE" || selected?.price === null;
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5" aria-label="Lựa chọn sản phẩm">
      {activeVariants.length > 0 ? (
        <label className="block text-sm font-semibold text-stone-800">
          Dung tích
          <select
            value={selected?.id ?? ""}
            onChange={(event) => selectVariant(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base font-normal text-stone-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
            aria-label="Dung tích"
          >
            {activeVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
          </select>
        </label>
      ) : (
        <p className="text-sm text-stone-600">Sản phẩm hiện chưa có lựa chọn khả dụng.</p>
      )}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Giá tham khảo</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{quote ? "Liên hệ báo giá" : formatVnd(selected?.price ?? null)}</p>
          {selected?.sku && <p className="mt-1 text-xs text-stone-500">Mã SKU: {selected.sku}</p>}
        </div>
        <button type="button" disabled={!selected} className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-300">
          Chọn sản phẩm
        </button>
      </div>
    </section>
  );
}
