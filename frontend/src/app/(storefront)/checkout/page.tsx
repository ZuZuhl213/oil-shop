'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [channel, setChannel] = useState<'Zalo' | 'Phone'>('Zalo');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipping fee logic: free for orders >= 500k, otherwise 30k
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'HMN10' || code === 'MOCBAN') {
      setDiscountPercent(10);
      setVoucherMessage({ type: 'success', text: `Áp dụng thành công mã ${code}: Giảm 10% giá trị đơn!` });
    } else if (code === 'FREESHIP') {
      setDiscountPercent(0);
      setVoucherMessage({ type: 'success', text: 'Áp dụng mã FREESHIP thành công!' });
    } else {
      setVoucherMessage({ type: 'error', text: 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng.' });
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.');
      return;
    }

    setIsSubmitting(true);

    // Canonical order code pattern from index.html: HMN-2026-9812
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `HMN-2026-${randomSuffix}`;

    const orderRecord = {
      orderCode,
      createdAt: new Date().toISOString(),
      customer: { fullName, phone, email, address, channel, note },
      items,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      status: 'PENDING_CONFIRMATION',
    };

    try {
      localStorage.setItem(`hm_order_${orderCode}`, JSON.stringify(orderRecord));
      localStorage.setItem('hm_latest_order_code', orderCode);
    } catch {
      // ignore
    }

    setTimeout(() => {
      clearCart();
      router.push(`/orders/${orderCode}`);
    }, 600);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div style={{ fontSize: 48 }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest-green)' }}>
          Giỏ hàng của bạn đang trống
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          Vui lòng chọn sản phẩm vào giỏ trước khi gửi phiếu đặt hàng.
        </p>
        <Link
          href="/products"
          className="btn-action-touch fixed-flow no-underline inline-flex"
        >
          Khám Phá Tuyển Phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container py-4 pb-20">
      {/* Header */}
      <div className="home-section-head" style={{ paddingTop: 14 }}>
        <div>
          <span className="section-eyebrow">Kịch bản mua lẻ trực tiếp</span>
          <h2 className="section-title">Phiếu Đặt Hàng Nông Phẩm</h2>
        </div>
      </div>

      <div className="form-screen-wrap">
        {/* Selected Products Summary */}
        <div className="space-y-3 mb-5">
          {items.map((item, idx) => (
            <div key={idx} className="form-order-summary">
              <div className="order-item-thumb overflow-hidden bg-warm-cream flex items-center justify-center">
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

        {/* Voucher Code Box */}
        <form onSubmit={handleApplyVoucher} className="mb-5 flex gap-2">
          <input
            type="text"
            className="form-field-input"
            placeholder="Mã giảm giá (Thử: HMN10)"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            style={{ textTransform: 'uppercase' }}
          />
          <button
            type="submit"
            className="btn-action-touch quote-flow"
            style={{ padding: '0 18px', whiteSpace: 'nowrap' }}
          >
            Áp Dụng
          </button>
        </form>

        {voucherMessage && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 14,
              background: voucherMessage.type === 'success' ? 'var(--peanut-gold-surface)' : '#FDF2F1',
              color: voucherMessage.type === 'success' ? 'var(--peanut-bark)' : 'var(--error-crimson)',
              border: `1px solid ${voucherMessage.type === 'success' ? 'var(--peanut-gold)' : 'var(--error-crimson)'}`,
            }}
          >
            {voucherMessage.text}
          </div>
        )}

        {/* Subtotal, Shipping, and Total Calculation */}
        <div
          style={{
            background: 'var(--white-pure)',
            border: '1px solid var(--soft-sand)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 18,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Tạm tính tiền hàng:</span>
            <span>{formatCurrencyVnd(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--peanut-bark)', fontWeight: 600 }}>
              <span>Chiết khấu mã giảm:</span>
              <span>- {formatCurrencyVnd(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Phí vận chuyển tận bếp:</span>
            <span>{shippingFee === 0 ? 'Miễn phí (Đơn ≥ 500k)' : formatCurrencyVnd(shippingFee)}</span>
          </div>
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
            <span>{formatCurrencyVnd(totalAmount)}</span>
          </div>
        </div>

        {/* Customer Information Form */}
        <form onSubmit={handleSubmitOrder}>
          <div className="form-row-group">
            <label className="form-field-label">Họ và tên người nhận *</label>
            <input
              type="text"
              className="form-field-input"
              placeholder="Ví dụ: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-row-group">
            <label className="form-field-label">Số điện thoại nhận hàng *</label>
            <input
              type="tel"
              className="form-field-input"
              placeholder="Ví dụ: 0912 345 678"
              pattern="0[0-9]{9}"
              title="Vui lòng nhập 10 chữ số bắt đầu bằng 0"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Optional Email Field with Explanatory Notice */}
          <div className="form-row-group">
            <label className="form-field-label">Email nhận biên nhận điện tử (Không bắt buộc)</label>
            <input
              type="email"
              className="form-field-input"
              placeholder="Ví dụ: nguyenvanan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
              Chỉ sử dụng để gửi bản sao biên nhận yêu cầu đặt hàng, xưởng không gửi thư rác hay quảng cáo.
            </span>
          </div>

          <div className="form-row-group">
            <label className="form-field-label">Địa chỉ nhận hàng tận nơi *</label>
            <input
              type="text"
              className="form-field-input"
              placeholder="Số nhà, tên đường, xã/phường, quận/huyện, tỉnh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-row-group">
            <label className="form-field-label">Kênh thuận tiện nhận xác nhận đơn *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: '#FFF',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--soft-sand)',
                }}
              >
                <input
                  type="radio"
                  name="orderContactChannel"
                  value="Zalo"
                  checked={channel === 'Zalo'}
                  onChange={() => setChannel('Zalo')}
                />{' '}
                Nhắn Zalo
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  background: '#FFF',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--soft-sand)',
                }}
              >
                <input
                  type="radio"
                  name="orderContactChannel"
                  value="Phone"
                  checked={channel === 'Phone'}
                  onChange={() => setChannel('Phone')}
                />{' '}
                Gọi điện thoại
              </label>
            </div>
          </div>

          <div className="form-row-group">
            <label className="form-field-label">Ghi chú giao hàng (Tùy chọn)</label>
            <textarea
              className="form-field-textarea"
              placeholder="Ví dụ: Giao vào buổi sáng hoặc giờ hành chính..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-action-touch fixed-flow"
            disabled={isSubmitting}
            style={{ width: '100%', height: 46, fontSize: 14 }}
          >
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu Đặt Hàng'}
          </button>
        </form>
      </div>
    </div>
  );
}
