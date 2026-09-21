"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import { getCategories, getProducts } from "@/lib/catalog-api";
import type { Category, Page, Product } from "@/lib/api-types";
import { CatalogGrid } from "./CatalogGrid";
import { ProductFilters } from "./ProductFilters";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
      <p className="font-semibold">Không thể tải dữ liệu</p>
      <p className="mt-1 text-sm">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900">Thử lại</button>
    </div>
  );
}

export function LoadingState() {
  return <div role="status" className="rounded-2xl bg-stone-100 p-8 text-center text-stone-600">Đang tải sản phẩm…</div>;
}

export function ProductsView({ fixedCategory }: { fixedCategory?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? "0") || 0);
  const keyword = searchParams.get("keyword") ?? "";
  const category = fixedCategory ?? searchParams.get("category") ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Page<Product> | null>(null);
  const [categoryMissing, setCategoryMissing] = useState(false);
  const [categoryError, setCategoryError] = useState<ApiClientError | Error | null>(null);
  const [productError, setProductError] = useState<ApiClientError | Error | null>(null);
  const [loadedProductKey, setLoadedProductKey] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const productKey = `${page}|${category}|${keyword}|${reload}`;

  useEffect(() => {
    let active = true;
    getCategories().then((value) => {
      if (!active) return;
      setCategories(value);
      if (fixedCategory) setCategoryMissing(!value.some((item) => item.slug === fixedCategory));
    }).catch((value) => { if (active) setCategoryError(value); });
    return () => { active = false; };
  }, [fixedCategory, reload]);

  useEffect(() => {
    let active = true;
    getProducts({ page, size: 12, category: category || undefined, keyword: keyword || undefined }).then((value) => {
      if (active) {
        setResult(value);
        setProductError(null);
        setLoadedProductKey(productKey);
      }
    }).catch((value) => { if (active) { setProductError(value); setLoadedProductKey(productKey); } });
    return () => { active = false; };
  }, [category, keyword, page, productKey]);

  const heading = useMemo(() => fixedCategory ? categories.find((item) => item.slug === fixedCategory)?.name ?? fixedCategory : "Tất cả sản phẩm", [categories, fixedCategory]);
  const basePath = pathname || "/products";
  function navigate(filters: { category?: string; keyword?: string }, nextPage = 0) {
    const params = new URLSearchParams();
    if (filters.category && !fixedCategory) params.set("category", filters.category);
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (nextPage > 0) params.set("page", String(nextPage));
    router.push(`${basePath}${params.toString() ? `?${params}` : ""}`);
  }

  if (categoryMissing) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">404</p><h1 className="mt-3 text-3xl font-bold text-stone-900">Không tìm thấy danh mục</h1><p className="mt-3 text-stone-600">Danh mục này không còn hiển thị hoặc chưa được tạo.</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white">Xem tất cả sản phẩm</Link></div>;
  }
  if (categoryError) return <main className="mx-auto max-w-7xl px-4 py-12"><ErrorState message={categoryError.message} onRetry={() => { setCategoryError(null); setReload((value) => value + 1); }} /></main>;
  if (loadedProductKey === productKey && productError) return <main className="mx-auto max-w-7xl px-4 py-12"><ErrorState message={productError.message} onRetry={() => setReload((value) => value + 1)} /></main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Danh mục sản phẩm</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{heading}</h1><p className="mt-2 max-w-2xl text-stone-600">Chọn sản phẩm phù hợp, xem quy cách và gửi yêu cầu tư vấn.</p></div>
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">Về trang chủ</Link>
      </div>
      <ProductFilters key={`${category}|${keyword}`} categories={categories} category={category} keyword={keyword} onChange={(filters) => navigate({ ...filters, category: fixedCategory ?? filters.category })} showCategory={!fixedCategory} />
      <div className="mt-8">{loadedProductKey !== productKey ? <LoadingState /> : result?.content.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center"><h2 className="text-xl font-semibold text-stone-900">Chưa có sản phẩm phù hợp</h2><p className="mt-2 text-stone-600">Bạn thử đổi từ khóa hoặc danh mục nhé.</p></div> : <CatalogGrid products={result?.content ?? []} />}</div>
      {result && result.totalPages > 1 && <nav aria-label="Phân trang sản phẩm" className="mt-8 flex items-center justify-center gap-3"><button type="button" disabled={page === 0} onClick={() => navigate({ category, keyword: keyword || undefined }, page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Trang trước</button><span className="text-sm text-stone-600">Trang {page + 1} / {result.totalPages}</span><button type="button" disabled={page + 1 >= result.totalPages} onClick={() => navigate({ category, keyword: keyword || undefined }, page + 1)} className="rounded-xl border border-stone-300 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Trang sau</button></nav>}
    </main>
  );
}
