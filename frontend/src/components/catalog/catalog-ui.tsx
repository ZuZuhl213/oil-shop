import Image from "next/image";
import type { Product } from "@/lib/api-types";

export function formatVnd(value: number | null): string {
  if (value === null) return "Liên hệ báo giá";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isAllowedImageUrl(value: string | null): value is string {
  if (!value) return false;
  const allowedHost = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_HOST;
  if (!allowedHost) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === allowedHost;
  } catch {
    return false;
  }
}

export function ProductImage({ product, priority = false }: { product: Product; priority?: boolean }) {
  if (!isAllowedImageUrl(product.thumbnailUrl)) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-amber-50 text-sm font-medium text-amber-800" aria-label="Ảnh sản phẩm đang cập nhật">
        Ảnh sản phẩm
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
      <Image
        src={product.thumbnailUrl}
        alt={product.name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
        className="object-cover transition duration-300 group-hover:scale-105"
      />
    </div>
  );
}
