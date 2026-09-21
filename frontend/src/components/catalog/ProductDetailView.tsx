"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api-client";
import { getProduct } from "@/lib/catalog-api";
import type { Product, Variant } from "@/lib/api-types";
import { ErrorState, LoadingState } from "./ProductsView";
import { ProductImage } from "./catalog-ui";
import { VariantSelector } from "./VariantSelector";

export function ProductDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Variant | null>(null);
  const [error, setError] = useState<ApiClientError | Error | null>(null);
  const [reload, setReload] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const requestKey = `${slug}:${reload}`;
  useEffect(() => {
    let active = true;
    getProduct(slug).then((value) => { if (active) { setProduct(value); setError(null); setLoadedKey(requestKey); } }).catch((value) => { if (active) { setError(value); setLoadedKey(requestKey); } });
    return () => { active = false; };
  }, [requestKey, slug]);

  if (loadedKey !== requestKey) return <main className="mx-auto max-w-7xl px-4 py-16"><LoadingState /></main>;
  if (error) {
    if (error instanceof ApiClientError && error.status === 404) return <NotFoundProduct />;
    return <main className="mx-auto max-w-5xl px-4 py-16"><ErrorState message={error.message} onRetry={() => setReload((value) => value + 1)} /></main>;
  }
  if (!product) return <main className="mx-auto max-w-7xl px-4 py-16"><LoadingState /></main>;
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/products" className="text-sm font-semibold text-emerald-800 hover:underline">← Quay lại danh sách</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start"><ProductImage product={product} priority /><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{product.saleType === "QUOTE" ? "Đặt theo yêu cầu" : "Sản phẩm"}</p><h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900">{product.name}</h1>{product.shortDescription && <p className="mt-4 text-lg leading-8 text-stone-600">{product.shortDescription}</p>}<div className="mt-8"><VariantSelector key={product.id} product={product} onChange={setSelected} /></div><p className="sr-only" aria-live="polite">{selected ? `Đã chọn ${selected.name}` : "Chưa chọn quy cách"}</p></div></div>
      {product.description && <section className="mt-12 max-w-3xl border-t border-stone-200 pt-8"><h2 className="text-2xl font-bold text-stone-900">Thông tin sản phẩm</h2><p className="mt-4 whitespace-pre-line leading-8 text-stone-700">{product.description}</p></section>}
    </main>
  );
}

function NotFoundProduct() {
  return <main className="mx-auto max-w-5xl px-4 py-20 text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">404</p><h1 className="mt-3 text-3xl font-bold text-stone-900">Không tìm thấy sản phẩm</h1><p className="mt-3 text-stone-600">Sản phẩm không tồn tại hoặc không còn được bán.</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white">Xem sản phẩm khác</Link></main>;
}
