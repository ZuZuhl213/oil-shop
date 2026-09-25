'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';

interface OrderReceiptPageProps {
  params: Promise<{ code: string }>;
}

export default function OrderReceiptPage({ params }: OrderReceiptPageProps) {
  const { code } = use(params);
  const [copied, setCopied] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hm_order_${code}`);
      if (saved) {
        setOrderData(JSON.parse(saved));
      } else {
        // Fallback demo mock order
        setOrderData({
          orderCode: code,
          createdAt: new Date().toISOString(),
          customer: {
            fullName: 'Khách Hàng HM NATURALS',
            phone: '0912 345 678',
            address: 'Hà Nội',
            channel: 'Zalo',
            note: 'Giao trong giờ hành chính',
          },
          items: [
            {
              productName: 'Dầu Phộng Ép Lạnh Cối Đá',
              variantName: '500ml',
              price: 165000,
              quantity: 1,
              thumbnailType: 'peanut',
            },
          ],
          subtotal: 165000,
          shippingFee: 30000,
          discountAmount: 0,
          totalAmount: 195000,
          status: 'PENDING_CONFIRMATION',
        });
      }
    } catch {
      // ignore
    }
  }, [code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mask phone for privacy (0912 *** *78)
  const maskPhone = (phoneStr: string) => {
    if (!phoneStr || phoneStr.length < 7) return '0912 *** *78';
    return `${phoneStr.slice(0, 4)} *** *${phoneStr.slice(-2)}`;
  };

  const steps = [
    {
      num: 1,
      title: 'Đã tiếp nhận yêu cầu',
      desc: 'Hệ thống xưởng đã ghi nhận yêu cầu vào sổ theo dõi.',
      time: 'Vừa xong',
      status: 'completed',
    },
    {
      num: 2,
      title: 'Xác nhận đơn qua Zalo/Điện thoại',
      desc: 'Nhân viên xưởng liên hệ thống nhất thời gian và quy cách.',
      time: 'Dự kiến trong 30 phút',
      status: 'active',
    },
    {
      num: 3,
      title: 'Ép mộc & Đóng chai thủy tinh',
      desc: 'Rót chai thủy tinh sẫm màu, niêm phong tem mộc kiểm định.',
      time: 'Trong ngày',
      status: 'upcoming',
    },
    {
      num: 4,
      title: 'Đang vận chuyển giao tận bếp',
      desc: 'Bàn giao đơn vị vận chuyển chuyên nghiệp bọc lót chống sốc.',
      time: '1 - 3 ngày',
      status: 'upcoming',
    },
    {
      num: 5,
      title: 'Hoàn tất đơn hàng',
      desc: 'Khách hàng kiểm tra chất lượng mùi thơm sánh trước khi nhận.',
      time: 'Hoàn tất',
      status: 'upcoming',
    },
  ];

  if (!orderData) {
    return (
      <div className="py-20 text-center text-text-muted">
        Đang tải thông tin đơn hàng...
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
          Biên Nhận Đặt Hàng
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Hệ thống xưởng đã ghi nhận yêu cầu đặt hàng. Xưởng HM NATURALS sẽ liên hệ trực tiếp để xác nhận thông tin chi tiết và thống nhất thời gian giao nhận trước khi xuất kho.
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

      {/* ── Status Progression Timeline Card (Stepper 5 bước) ── */}
      <div className="status-timeline-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Tiến độ xử lý yêu cầu:
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: 99,
            fontSize: 11.5,
            fontWeight: 700,
            background: 'var(--peanut-gold-surface)',
            color: 'var(--peanut-bark)',
          }}>
            Bước 1/5: Tiếp nhận
          </span>
        </div>

        <div className="stepper-list">
          {steps.map((st) => (
            <div
              key={st.num}
              className={`step-item ${st.status === 'completed' ? 'completed' : ''} ${st.status === 'active' ? 'active' : ''}`}
            >
              <div className="step-bullet">{st.num}</div>
              <div className="step-content-text">
                <h4>{st.title}</h4>
                <p>{st.desc}</p>
                <time>{st.time}</time>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Privacy Protected Customer Data Card ── */}
      <div className="privacy-info-card">
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--deep-olive)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Thông tin bảo mật khách hàng:
        </span>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Mã yêu cầu đơn:</span>
          <span className="privacy-val">{orderData.orderCode}</span>
        </div>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Người nhận:</span>
          <span className="privacy-val">{orderData.customer?.fullName || 'Khách hàng'}</span>
        </div>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Số điện thoại:</span>
          <span className="privacy-val">{maskPhone(orderData.customer?.phone)}</span>
        </div>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Địa bàn nhận hàng:</span>
          <span className="privacy-val">{orderData.customer?.address || 'Hà Nội'}</span>
        </div>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Kênh liên hệ xác nhận:</span>
          <span className="privacy-val">{orderData.customer?.channel || 'Zalo'}</span>
        </div>
        <div className="privacy-info-row">
          <span className="privacy-lbl">Phương thức thanh toán:</span>
          <span className="privacy-val">Thanh toán khi nhận hàng (COD)</span>
        </div>
      </div>

      {/* ── Order Summary Card ── */}
      <div className="space-y-2 mb-4">
        {orderData.items?.map((item: any, idx: number) => (
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
                {formatCurrencyVnd(item.price * item.quantity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Total Cost Breakdown ── */}
      <div
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
          <span>{orderData.shippingFee === 0 ? 'Miễn phí' : formatCurrencyVnd(orderData.shippingFee)}</span>
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
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <a
          href="tel:0912345678"
          className="btn-action-touch quote-flow no-underline"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Liên Hệ Hotline Xưởng Ép: 0912 345 678
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
