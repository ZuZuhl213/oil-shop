'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getMockProductBySlug, mockProducts, mockCategories } from '@/lib/mock-data';
import type { VariantDto } from '@/lib/api/contracts/types';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/product/ProductCard';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const product = getMockProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const { addItem, openCart } = useCart();
  const isQuote = product.saleType === 'QUOTE';
  const category = mockCategories.find((c) => c.id === product.categoryId);

  const [selectedVariant, setSelectedVariant] = useState<VariantDto | undefined>(
    product.variants[0]
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [show360Modal, setShow360Modal] = useState<boolean>(false);
  const [bottle360Angle, setBottle360Angle] = useState<number>(0);

  const currentPrice = selectedVariant?.price ?? 0;
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    if (!selectedVariant || isQuote || !selectedVariant.price) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      thumbnailType: product.visualType,
    });
  };

  const handleBuyNow = () => {
    if (isQuote) {
      router.push(`/contact?product=${encodeURIComponent(product.name)}`);
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  // Related products from same category
  const relatedProducts = mockProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="site-container py-4 pb-28">
      {/* ── Main Detail Scroll Area ── */}
      <div className="detail-scroll-area">
        {/* Gallery with 4:3 Ratio */}
        <div className="detail-gallery-wrap">
          <Link href="/products" className="back-touch-circle" aria-label="Quay lại danh mục">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <ProductBottleImage type={product.visualType} alt={product.name} />
          <span className="photo-illustrate-tag">Ảnh mẫu minh họa</span>
        </div>

        {/* Product Information Body */}
        <div className="detail-body-content">
          <span className="d-cat">{category?.name || 'Nông Sản Bản Địa'}</span>
          <h1 className="d-title">{product.name}</h1>
          <p className="d-desc">{product.description || product.shortDescription}</p>

          {/* 360 Degree View Interactive Button */}
          <div>
            <button
              type="button"
              className="btn-360-view-pill"
              onClick={() => setShow360Modal(true)}
              aria-label="Xem 360 độ chai dầu HM NATURALS"
            >
              <span aria-hidden="true">🔄</span>
              <span>Xem 360° Chai Dầu HM NATURALS</span>
            </button>
          </div>

          {/* Price Box */}
          <div className="d-price-box">
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                {isQuote ? 'Quy cách định dạng' : 'Giá quy cách'}
              </span>
              <span className="d-price-val">
                {isQuote ? 'Liên hệ báo giá sỉ' : formatCurrencyVnd(currentPrice)}
              </span>
            </div>
            <span className="d-status-pill">
              {isQuote ? 'Báo giá theo số lượng' : 'Sẵn sàng giao tận bếp'}
            </span>
          </div>

          {/* Variant Selector */}
          {!isQuote && product.variants.length > 0 && (
            <div id="detailVariantBlock">
              <div className="variant-section-title">Chọn Dung Tích / Quy Cách:</div>
              <div className="variant-pills-row">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`var-pill ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.name}
                  </button>
                ))}
              </div>

              {/* Quantity Selector */}
              <div className="qty-selector-row">
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark-cocoa)' }}>Số lượng:</span>
                <div className="qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Giảm 1"
                  >
                    −
                  </button>
                  <span className="qty-number">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Tăng 1"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quote Tiers if Quote Product */}
          {isQuote && product.quoteTiers && (
            <div className="specs-card-box" style={{ background: 'var(--peanut-gold-surface)', borderColor: 'rgba(200,139,58,0.3)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--peanut-bark)', textTransform: 'uppercase', marginBottom: 6 }}>
                📋 Quy cách báo giá sỉ &amp; đại lý:
              </div>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--dark-cocoa)', lineHeight: 1.6 }}>
                {product.quoteTiers.map((tier, idx) => (
                  <li key={idx}>{tier}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Product Specifications Card */}
          {product.specs && product.specs.length > 0 && (
            <div className="specs-card-box">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--deep-olive)', textTransform: 'uppercase', marginBottom: 6 }}>
                Thông số kỹ thuật sản phẩm:
              </div>
              <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {product.specs.map((spec, idx) => (
                  <li key={idx}>
                    <strong style={{ color: 'var(--dark-cocoa)' }}>{spec.label}: </strong>
                    <span>{spec.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="article-related-box" style={{ marginTop: 24, paddingTop: 18 }}>
              <span className="section-eyebrow">Tuyển phẩm cùng chuyên mục</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest-green)', margin: '4px 0 14px' }}>
                Nông Phẩm Liên Quan
              </h3>
              <div className="product-grid-2col" style={{ padding: 0 }}>
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Purchase Bar ── */}
      <div className="sticky-bottom-bar">
        <div className="bottom-bar-price-calc">
          <span className="b-calc-label">Tạm tính:</span>
          <span className="b-calc-figure">
            {isQuote ? 'Theo đơn sỉ' : formatCurrencyVnd(totalPrice)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isQuote && (
            <button
              type="button"
              className="btn-action-touch quote-flow"
              onClick={handleAddToCart}
              style={{ padding: '0 16px' }}
            >
              + Giỏ Hàng
            </button>
          )}
          <button
            type="button"
            className="btn-action-touch fixed-flow"
            onClick={handleBuyNow}
            style={{ padding: '0 20px' }}
          >
            {isQuote ? 'Gửi Yêu Cầu Báo Giá' : 'Đặt Mua Ngay'}
          </button>
        </div>
      </div>

      {/* ── 360 View Interactive Modal ── */}
      {show360Modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-cocoa/60 backdrop-blur-xs"
          onClick={() => setShow360Modal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-soft-sand shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-soft-sand mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h3 className="font-display font-bold text-base text-forest-green">
                  Mô Phỏng 360° Chai Dầu HM NATURALS
                </h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-soft-sand flex items-center justify-center text-text-muted hover:text-dark-cocoa cursor-pointer"
                onClick={() => setShow360Modal(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-center">
              <div
                className="aspect-square max-w-[240px] mx-auto bg-warm-cream/50 rounded-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-100"
                style={{ transform: `rotateY(${bottle360Angle}deg)` }}
              >
                <ProductBottleImage type={product.visualType} alt={product.name} />
              </div>

              {/* Angle slider */}
              <div className="mt-6 space-y-2">
                <label className="text-xs font-semibold text-text-muted block">
                  Kéo để xoay 360 độ: {bottle360Angle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={bottle360Angle}
                  onChange={(e) => setBottle360Angle(Number(e.target.value))}
                  className="w-full accent-forest-green"
                />
              </div>

              <p className="text-xs text-text-muted mt-3">
                Chai thủy tinh hổ phách chắn sáng 90%, nắp nút bần gỗ sồi chống tràn và nhãn giấy mỹ thuật mộc.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
