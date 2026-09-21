import Link from "next/link";
import type { Product } from "@/lib/api-types";
import { formatVnd, ProductImage } from "./catalog-ui";

export function ProductCard({ product }: { product: Product }) {
  const firstVariant = product.variants[0];
  const isQuote = product.saleType === "QUOTE" || firstVariant?.price === null || !firstVariant;
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
        <ProductImage product={product} />
        <div className="px-1 pb-2 pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{product.saleType === "QUOTE" ? "Đặt theo yêu cầu" : "Sản phẩm"}</p>
          <h2 className="line-clamp-2 min-h-12 text-lg font-semibold text-stone-900">{product.name}</h2>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">{product.shortDescription || "Sản phẩm từ nguồn nguyên liệu được tuyển chọn."}</p>
          <p className="mt-4 text-base font-bold text-emerald-800">{isQuote ? "Liên hệ báo giá" : formatVnd(firstVariant.price)}</p>
        </div>
      </Link>
      <Link
        href={`/products/${product.slug}`}
        className="mt-auto rounded-xl border border-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        Xem chi tiết
      </Link>
    </article>
  );
}
