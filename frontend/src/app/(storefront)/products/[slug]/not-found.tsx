import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="site-container py-20 text-center">
      <h1 className="section-title">Không tìm thấy sản phẩm</h1>
      <p role="alert">Không tìm thấy sản phẩm này hoặc sản phẩm đã ngừng bán.</p>
      <Link href="/products" className="btn-action-touch fixed-flow no-underline inline-flex mt-4">Quay lại danh mục</Link>
    </div>
  );
}
