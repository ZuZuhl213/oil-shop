'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    isCartOpen,
    closeCart,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-drawer-backdrop ${isCartOpen ? 'open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Cart Drawer Panel */}
      <aside
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng HM NATURALS"
      >
        {/* Head */}
        <div className="cart-drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--forest-green)' }}>
              Giỏ Hàng HM NATURALS
            </span>
          </div>
          <button
            type="button"
            style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', padding: 8 }}
            onClick={closeCart}
            aria-label="Đóng giỏ hàng"
          >
            ✕
          </button>
        </div>

        {/* Items List */}
        <div className="cart-drawer-items-list">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🛍️</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--forest-green)', marginBottom: 4 }}>
                Giỏ hàng còn trống
              </h4>
              <p style={{ fontSize: 12.5 }}>Bạn chưa chọn nông phẩm ép mộc nào vào giỏ.</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="btn-action-touch fixed-flow no-underline inline-flex"
                style={{ marginTop: 14 }}
              >
                Khám Phá Sản Phẩm
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="cart-item-card">
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'var(--warm-cream)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ProductBottleImage type={item.thumbnailType || 'peanut'} alt={item.productName} />
                </div>

                <div className="cart-item-info">
                  <div className="cart-item-title">{item.productName}</div>
                  <div className="cart-item-meta">
                    {item.variantName} • {formatCurrencyVnd(item.price)}
                  </div>
                  <div className="cart-item-price">
                    {formatCurrencyVnd(item.price * item.quantity)}
                  </div>
                </div>

                {/* Qty & Remove */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}
                    aria-label={`Xóa ${item.productName}`}
                  >
                    ✕ Xóa
                  </button>
                  <div className="qty-controls" style={{ height: 32 }}>
                    <button
                      type="button"
                      className="qty-btn"
                      style={{ width: 30, height: 30, fontSize: 15 }}
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      aria-label="Giảm"
                    >
                      −
                    </button>
                    <span className="qty-number" style={{ width: 24, fontSize: 13 }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="qty-btn"
                      style={{ width: 30, height: 30, fontSize: 15 }}
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      aria-label="Tăng"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-subtotal">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark-cocoa)' }}>
                {formatCurrencyVnd(subtotal)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--peanut-bark)', marginBottom: 10, lineHeight: 1.4 }}>
              * Hàng báo giá sỉ (Sachi, Bã đậu phộng) được lập phiếu riêng, không gộp chung trong giỏ này.
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-action-touch fixed-flow no-underline"
              style={{ width: '100%', height: 44, textAlign: 'center' }}
            >
              Tiến Hành Đặt Hàng ({totalItems})
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
