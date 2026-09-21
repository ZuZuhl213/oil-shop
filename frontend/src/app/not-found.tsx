import Link from "next/link";

export default function NotFound() {
  return <main className="mx-auto max-w-5xl px-4 py-24 text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">404</p><h1 className="mt-3 text-4xl font-bold text-stone-900">Trang này không tồn tại</h1><p className="mt-3 text-stone-600">Bạn có thể quay về trang chủ hoặc xem danh sách sản phẩm.</p><div className="mt-7 flex justify-center gap-3"><Link href="/" className="rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-800">Trang chủ</Link><Link href="/products" className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white">Sản phẩm</Link></div></main>;
}
