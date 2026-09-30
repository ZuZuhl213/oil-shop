'use client';

/* eslint-disable react-hooks/set-state-in-effect -- browser hydration/API synchronization */

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import type { ExtendedProductDto } from '@/lib/mock-data';
import { ApiClientError, getCategories, getProductBySlug, getProducts } from '@/lib/api/client';
import { toUiProduct, toUiProducts } from '@/lib/catalog-adapter';
import { saveQuoteDraft } from '@/lib/checkout-storage';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/product/ProductCard';
import Product360Modal from '@/components/product/Product360Modal';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [retry, setRetry] = useState(0);
  const requestKey = slug + ':' + retry;
  const [result, setResult] = useState<{ key: string; product?: ExtendedProductDto; error?: string; notFound?: boolean } | null>(null);
  const [related, setRelated] = useState<{ key: string; products: ExtendedProductDto[] } | null>(null);
  const current = result?.key === requestKey ? result : null;
  const product = current?.product;
  const isLoading = !current;
  const loadError = current?.error;
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState<number>(1);
  const [show360Modal, setShow360Modal] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    getProductBySlug(slug)
      .then((apiProduct) =>
        getCategories()
          .catch(() => [])
          .then((categories) => ({ apiProduct, categories })),
      )
      .then(({ apiProduct, categories }) => {
        if (!active) return;
        const category = categories.find((item) => item.id === apiProduct.categoryId);
        setResult({ key: requestKey, product: toUiProduct(apiProduct, category) });
        if (category) {
          getProducts({ category: category.slug, size: 5 })
            .then((page) => {
              if (active) setRelated({ key: requestKey, products: toUiProducts(page.content.filter((item) => item.id !== apiProduct.id), categories).slice(0, 4) });
            })
            .catch(() => { if (active) setRelated({ key: requestKey, products: [] }); });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const notFound = error instanceof ApiClientError && error.status === 404;
        setResult({ key: requestKey, notFound, error: notFound ? 'Không tìm thấy sản phẩm này.' : 'Không tải được sản phẩm. Vui lòng thử lại.' });
      });
    return () => {
      active = false;
    };
  }, [slug, retry, requestKey]);

  useEffect(() => {
    if (!product) return;
    const firstVariant = product.variants.find((variant) => variant.isActive);
    setSelectedVariantId(firstVariant?.id);
    setQuantity(firstVariant?.minQuantity ?? 1);
  }, [product]);

  const selectedVariant = product?.variants.find((variant) => variant.id === selectedVariantId && variant.isActive)
    ?? product?.variants.find((variant) => variant.isActive);
  const isQuote = product?.saleType === 'QUOTE';
  const currentPrice = selectedVariant?.price ?? null;
  const totalPrice = currentPrice == null ? null : currentPrice * quantity;
  const categoryName = product?.categoryName || 'Nông Sản Bản Địa';

  const handleAddToCart = () => {
    if (!product || !selectedVariant?.isActive || isQuote || selectedVariant.price == null) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      minQuantity: selectedVariant.minQuantity,
      quantityStep: selectedVariant.quantityStep,
      saleType: product.saleType,
      thumbnailType: product.visualType,
    });
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant || !selectedVariant.isActive) return;
    if (isQuote) {
      saveQuoteDraft(undefined, {
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            variantId: selectedVariant.id,
            variantName: selectedVariant.name,
            quantity,
            minQuantity: selectedVariant.minQuantity,
            quantityStep: selectedVariant.quantityStep,
            thumbnailType: product.visualType,
      });
      router.push('/checkout?mode=quote');
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  const relatedProducts = related?.key === requestKey ? related.products : [];

  if (current?.notFound) notFound();

  if (!product) {
    return (
      <div className="site-container py-20 text-center">
        <p role={loadError ? 'alert' : 'status'} className="text-text-muted">{isLoading ? 'Đang tải sản phẩm…' : (loadError || 'Không tìm thấy sản phẩm.')}</p>
        {!isLoading && !current?.notFound && <button type="button" className="btn-action-touch fixed-flow mt-4" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>}
        {!isLoading && <Link href="/products" className="btn-action-touch fixed-flow no-underline inline-flex mt-4">Quay lại danh mục</Link>}
      </div>
    );
  }

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
          <span className="d-cat">{categoryName}</span>
          <h1 className="d-title">{product.name}</h1>
          <p className="d-desc">{product.description || product.shortDescription}</p>
          {selectedVariant?.sku && <p className="text-sm text-text-muted">SKU: {selectedVariant.sku}</p>}

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
          {product.variants.length > 0 && (
            <div id="detailVariantBlock">
              <div className="variant-section-title">Chọn Dung Tích / Quy Cách:</div>
              <div className="variant-pills-row">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`var-pill ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => { setSelectedVariantId(v.id); setQuantity(v.minQuantity); }}
                    disabled={!v.isActive}
                    aria-pressed={selectedVariant?.id === v.id}
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
                    onClick={() => setQuantity((q) => Math.max(selectedVariant?.minQuantity ?? 1, Number((q - (selectedVariant?.quantityStep ?? 1)).toFixed(6))))}
                    aria-label="Giảm theo quy cách"
                  >
                    −
                  </button>
                  <span className="qty-number">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Number((q + (selectedVariant?.quantityStep ?? 1)).toFixed(6)))}
                    aria-label="Tăng theo quy cách"
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
              disabled={!selectedVariant?.isActive || selectedVariant.price == null}
              style={{ padding: '0 16px' }}
            >
              + Giỏ Hàng
            </button>
          )}
          <button
            type="button"
            className="btn-action-touch fixed-flow"
            onClick={handleBuyNow}
            disabled={!selectedVariant?.isActive}
            style={{ padding: '0 20px' }}
          >
            {isQuote ? 'Gửi Yêu Cầu Báo Giá' : 'Đặt Mua Ngay'}
          </button>
        </div>
      </div>

      {/* ── 360 View Interactive Modal ── */}
      {show360Modal && (
        <Product360Modal productName={product.name} visualType={product.visualType} onClose={() => setShow360Modal(false)} />
      )}
    </div>
  );
}
