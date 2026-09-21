"use client";

import { useState } from "react";
import type { Category } from "@/lib/api-types";

interface ProductFiltersProps {
  categories: Category[];
  category?: string;
  keyword?: string;
  showCategory?: boolean;
  onChange: (filters: { category?: string; keyword?: string }) => void;
}

export function ProductFilters({ categories, category = "", keyword = "", showCategory = true, onChange }: ProductFiltersProps) {
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [draftCategory, setDraftCategory] = useState(category);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ category: draftCategory || undefined, keyword: draftKeyword.trim() || undefined });
  }

  return (
    <form onSubmit={submit} className={`grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:items-end ${showCategory ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
      <div>
        <label htmlFor="product-keyword" className="text-sm font-semibold text-stone-800">Tìm sản phẩm</label>
        <input id="product-keyword" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} placeholder="Ví dụ: dầu lạc" className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" />
      </div>
      {showCategory && <div>
        <label htmlFor="product-category" className="text-sm font-semibold text-stone-800">Danh mục</label>
        <select id="product-category" aria-label="Danh mục" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200">
          <option value="">Tất cả danh mục</option>
          {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
      </div>}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-xl bg-emerald-800 px-5 py-2.5 font-semibold text-white hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:flex-none">Lọc</button>
        <button type="button" onClick={() => { setDraftKeyword(""); setDraftCategory(""); onChange({}); }} className="rounded-xl border border-stone-300 px-4 py-2.5 font-semibold text-stone-700 hover:bg-stone-50">Xóa</button>
      </div>
    </form>
  );
}
