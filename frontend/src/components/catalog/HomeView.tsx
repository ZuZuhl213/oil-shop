"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import { getCategories, getProducts } from "@/lib/catalog-api";
import type { Category, Product } from "@/lib/api-types";
import { CatalogGrid } from "./CatalogGrid";
import { ErrorState, LoadingState } from "./ProductsView";

export function HomeView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<ApiClientError | Error | null>(null);
  const [loadedReload, setLoadedReload] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getProducts({ page: 0, size: 8 })]).then(([nextCategories, nextProducts]) => {
      if (!active) return;
      setCategories(nextCategories);
      setProducts(nextProducts.content);
      setError(null);
      setLoadedReload(reload);
    }).catch((value) => { if (active) { setError(value); setLoadedReload(reload); } });
    return () => { active = false; };
  }, [reload]);

  const loading = loadedReload !== reload;
  return (
    <main>
      <section className="bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">Dầu lạc & nguyên liệu tự nhiên</p><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Chọn nguyên liệu sạch cho căn bếp của bạn.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-100">Khám phá các sản phẩm dầu lạc, hạt và nguyên liệu được tuyển chọn. Bạn có thể xem quy cách và gửi yêu cầu tư vấn trực tiếp.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/products" className="rounded-xl bg-amber-300 px-5 py-3 font-bold text-emerald-950 hover:bg-amber-200">Xem sản phẩm</Link><Link href="#categories" className="rounded-xl border border-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-900">Xem danh mục</Link></div></div>
          <div className="rounded-[2rem] border border-emerald-700 bg-emerald-900/70 p-8"><p className="text-7xl" aria-hidden="true">🥜</p><p className="mt-8 text-2xl font-semibold">Từ hạt nhỏ đến hương vị lớn</p><p className="mt-3 text-emerald-100">Thông tin sản phẩm minh bạch, lựa chọn linh hoạt theo nhu cầu.</p></div>
        </div>
      </section>
      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Khám phá</p><h2 className="mt-2 text-3xl font-bold text-stone-900">Danh mục sản phẩm</h2></div><Link href="/products" className="text-sm font-semibold text-emerald-800 hover:underline">Tất cả sản phẩm</Link></div>{loading ? <div className="mt-7"><LoadingState /></div> : error ? <div className="mt-7"><ErrorState message={error.message} onRetry={() => setReload((value) => value + 1)} /></div> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-2xl border border-stone-200 bg-amber-50 p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"><h3 className="text-lg font-bold text-stone-900">{category.name}</h3><p className="mt-2 line-clamp-2 text-sm text-stone-600">{category.description || "Xem các sản phẩm trong danh mục."}</p></Link>)}</div>}</section>
      {!loading && !error && <section className="bg-stone-50"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Gợi ý cho bạn</p><h2 className="mt-2 text-3xl font-bold text-stone-900">Sản phẩm nổi bật</h2></div><Link href="/products" className="text-sm font-semibold text-emerald-800 hover:underline">Xem thêm</Link></div><div className="mt-7"><CatalogGrid products={products} /></div></div></section>}
    </main>
  );
}
