'use client';

/* eslint-disable react-hooks/set-state-in-effect -- browser hydration/API synchronization */

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import type { OrderReceipt } from '@/lib/api/contracts/types';
import { readReceipt } from '@/lib/checkout-storage';
import { siteConfig } from '@/config/site';

interface ReceiptItem {
  productId?: string;
  productName: string;
  variantId: string;
  variantName: string;
  price: number | null;
  quantity: number;
  thumbnailType: 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';
}

interface StoredOrder extends OrderReceipt {
  customer?: {
    fullName: string;
    phone: string;
    address: string;
    channel: string;
    note: string;
  };
  items: ReceiptItem[];
  shippingFee?: number;
}

interface OrderReceiptPageProps {
  params: Promise<{ code: string }>;
}

export default function OrderReceiptPage({ params }: OrderReceiptPageProps) {
  const { code } = use(params);
  const [copied, setCopied] = useState(false);
  const [orderData, setOrderData] = useState<StoredOrder | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setOrderData(readReceipt<StoredOrder>(undefined, code));
    setHasLoaded(true);
  }, [code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasLoaded) {
    return (
      <div className="py-20 text-center text-text-muted">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div style={{ fontSize: 42 }}>🧾</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest-green)' }}>
          Biên nhận chỉ có trong phiên gửi đơn này
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Không tìm thấy biên nhận trong phiên này cho mã {code}. Hãy liên hệ shop và cung cấp mã này để xác nhận yêu cầu đã gửi.
        </p>
        <Link href="/products" className="btn-action-touch fixed-flow no-underline inline-flex">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  return (
    <div className="receipt-container py-4 pb-16">
      {/* ── Receipt Head Card ── */}
      <div className="receipt-head-card">
        <div className="receipt-icon-circle">✓</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--deep-olive)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Đã Tiếp Nhận Yêu Cầu
        </span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest-green)', margin: '4px 0 8px' }}>
          {orderData.orderType === 'QUOTE_REQUEST' ? 'Biên Nhận Yêu Cầu Báo Giá' : 'Biên Nhận Đặt Hàng'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Yêu cầu đã được ghi nhận. HM NATURALS sẽ liên hệ để xác nhận thông tin, giá và phí giao nhận trước khi xử lý.
        </p>

        {/* Official Order Code Returned by Backend */}
        <div className="order-code-box">
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--peanut-bark)', textTransform: 'uppercase', display: 'block' }}>
              Mã Yêu Cầu Chính Thức:
            </span>
            <span className="order-code-text">{orderData.orderCode}</span>
          </div>
          <button
            type="button"
            className="copy-pill-btn"
            onClick={handleCopyCode}
            aria-label="Sao chép mã đơn"
          >
            <span>{copied ? '✓ Đã chép' : 'Sao chép'}</span>
          </button>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--peanut-gold-surface)',
          border: '1px solid rgba(200,139,58,0.3)',
          padding: '5px 14px',
          borderRadius: 99,
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--peanut-bark)',
        }}>
          <span>Trạng thái ban đầu:</span>
          <strong style={{ color: 'var(--forest-green)' }}>Đã tiếp nhận yêu cầu</strong>
        </div>
      </div>

      <div className="status-timeline-card">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Tiếp theo
        </span>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Shop sẽ liên hệ theo thông tin bạn đã cung cấp để xác nhận yêu cầu. Đơn hàng chưa được thanh toán.
        </p>
      </div>

      {/* ── Privacy Protected Customer Data Card ── */}
      <div className="privacy-info-card">
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--deep-olive)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Bảo mật thông tin liên hệ:
        </span>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Mã yêu cầu đơn:</span>
          <span className="privacy-val">{orderData.orderCode}</span>
        </div>
        <p className="text-sm leading-6 text-text-muted">
          Vì quyền riêng tư, thông tin liên hệ không hiển thị trên biên nhận.
        </p>
      </div>

      {/* ── Order Summary Card ── */}
      <div className="space-y-2 mb-4">
        {orderData.items.map((item, idx) => (
          <div key={idx} className="form-order-summary">
            <div className="order-item-thumb bg-warm-cream flex items-center justify-center overflow-hidden">
              <ProductBottleImage type={item.thumbnailType || 'peanut'} alt={item.productName} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--forest-green)' }}>
                {item.productName}
              </h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Quy cách: {item.variantName} • Số lượng: {item.quantity}
              </span>
              <div style={{ fontWeight: 700, color: 'var(--dark-cocoa)', fontSize: 14.5, marginTop: 2 }}>
                {orderData.orderType === 'QUOTE_REQUEST' || item.price == null
                  ? 'Shop sẽ báo giá sau khi xác nhận'
                  : formatCurrencyVnd(item.price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Total Cost Breakdown ── */}
      {orderData.orderType === 'QUOTE_REQUEST' ? (
        <div className="rounded-xl border border-soft-sand bg-white-pure p-4 text-sm leading-6 text-text-muted">
          Yêu cầu báo giá không có tổng tiền cố định. Shop sẽ liên hệ để xác nhận số lượng và mức giá.
        </div>
      ) : orderData.subtotal != null && orderData.totalAmount != null ? <div
        style={{
          background: 'var(--white-pure)',
          border: '1px solid var(--soft-sand)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Tạm tính tiền hàng:</span>
          <span>{formatCurrencyVnd(orderData.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Phí vận chuyển:</span>
          <span>Shop xác nhận qua điện thoại</span>
        </div>
        {orderData.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--peanut-bark)' }}>
            <span>Chiết khấu mã giảm:</span>
            <span>- {formatCurrencyVnd(orderData.discountAmount)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--forest-green)',
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid var(--soft-sand-light)',
          }}
        >
          <span>Tổng thanh toán:</span>
          <span>{formatCurrencyVnd(orderData.totalAmount)}</span>
        </div>
      </div> : null}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <a
          href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
          className="btn-action-touch quote-flow no-underline"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Liên Hệ Hotline Xưởng Ép: {siteConfig.phone}
        </a>
        <Link
          href="/"
          className="btn-action-touch fixed-flow no-underline"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Tiếp Tục Xem Nông Phẩm
        </Link>
      </div>
    </div>
  );
}
