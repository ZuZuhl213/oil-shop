'use client';

/* eslint-disable react-hooks/set-state-in-effect -- hydrate quote draft from session storage */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/context/CartContext';
import { ApiClientError } from '@/lib/api/client';
import { createOrder } from '@/lib/api/orders';
import { validateVoucher } from '@/lib/api/vouchers';
import type { CreateOrderRequest, OrderReceipt, PricePreview } from '@/lib/api/contracts/types';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import {
  clearPendingOrder, clearQuoteDraft, readPendingOrder, readQuoteDraft,
  rememberReceipt, savePendingOrder, type PendingOrderAttempt, type QuoteDraft,
} from '@/lib/checkout-storage';

type CheckoutLine = Omit<CartItem, 'price'> & { price: number | null };

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0');
}

function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    const firstFieldError = Object.values(error.fieldErrors)[0];
    return firstFieldError || error.message;
  }
  return fallback;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();
  const isQuoteMode = searchParams.get('mode') === 'quote';
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [pendingAttempt, setPendingAttempt] = useState<PendingOrderAttempt | null>(null);
  const [checkoutHydrated, setCheckoutHydrated] = useState(false);
  const submittingRef = useRef(false);
  const draftItems: CheckoutLine[] = isQuoteMode && quoteDraft
    ? [{ ...quoteDraft, price: null, saleType: 'QUOTE' }]
    : isQuoteMode ? [] : items;
  const checkoutItems: CheckoutLine[] = pendingAttempt
    ? pendingAttempt.payload.items.map((line) => {
      const local = draftItems.find((item) => item.variantId === line.variantId);
      return local ? { ...local, quantity: line.quantity } : {
        productId: '', productName: 'Sản phẩm trong yêu cầu đã gửi', productSlug: '',
        variantId: line.variantId, variantName: '#' + line.variantId, quantity: line.quantity,
        price: null, thumbnailType: 'peanut',
      };
    })
    : draftItems;
  const isQuoteOrder = pendingAttempt
    ? pendingAttempt.payload.orderType === 'QUOTE_REQUEST'
    : isQuoteMode;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [channel, setChannel] = useState<'Zalo' | 'Phone'>('Zalo');
  const [note, setNote] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [pricePreview, setPricePreview] = useState<PricePreview | null>(null);
  const [pricePreviewSignature, setPricePreviewSignature] = useState<string | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVoucherLoading, setIsVoucherLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);
  const submissionSucceededRef = useRef(false);

  useEffect(() => {
    const attempt = readPendingOrder();
    setPendingAttempt(attempt);
    setQuoteDraft(isQuoteMode ? readQuoteDraft() : null);
    if (attempt) {
      setFullName(attempt.payload.customerName);
      setPhone(attempt.payload.phone);
      setAddress(attempt.payload.address ?? '');
      const savedNote = attempt.payload.note ?? '';
      setChannel(savedNote.endsWith('Kênh xác nhận: Phone') ? 'Phone' : 'Zalo');
      setNote(savedNote.replace(/(?:^|\n)Kênh xác nhận: (?:Phone|Zalo)$/, ''));
      setVoucherCode(attempt.payload.voucherCode ?? '');
    }
    setCheckoutHydrated(true);
  }, [isQuoteMode]);

  const cartSignature = items.map((item) => item.variantId + ':' + item.quantity).join('|');
  const voucherSignature = cartSignature + '|' + voucherCode.trim().toUpperCase();
  const activePricePreview = pricePreviewSignature === voucherSignature ? pricePreview : null;
  const retrySubtotal = checkoutItems.every((item) => item.price != null)
    ? checkoutItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)
    : null;
  const estimatedSubtotal = pendingAttempt ? retrySubtotal : subtotal;
  const discountAmount = isQuoteOrder ? 0 : activePricePreview?.discountAmount ?? 0;
  const displaySubtotal = isQuoteOrder ? null : activePricePreview?.subtotal ?? estimatedSubtotal;
  const totalAmount = isQuoteOrder ? null : activePricePreview?.totalAmount ?? estimatedSubtotal;

  const handleApplyVoucher = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = voucherCode.trim().toUpperCase();
    if (!code || isQuoteOrder || isVoucherLoading) return;

    setIsVoucherLoading(true);
    setVoucherMessage(null);
    try {
      const preview = await validateVoucher({
        code,
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      });
      setPricePreview(preview);
      setPricePreviewSignature(voucherSignature);
      setVoucherMessage({
        type: 'success',
        text: preview.voucherCode
          ? 'Áp dụng thành công mã ' + preview.voucherCode + '.'
          : 'Mã giảm giá đã được kiểm tra.',
      });
    } catch (error) {
      setPricePreview(null);
      setPricePreviewSignature(null);
      setVoucherMessage({
        type: 'error',
        text: apiMessage(error, 'Mã giảm giá không hợp lệ hoặc đã hết lượt dùng.'),
      });
    } finally {
      setIsVoucherLoading(false);
    }
  };

  const handleSubmitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!checkoutHydrated || submittingRef.current || submissionSucceededRef.current) return;
    if (!pendingAttempt && (!fullName.trim() || !phone.trim())) {
      setSubmitError('Vui lòng điền Họ tên và Số điện thoại.');
      return;
    }
    if (checkoutItems.length === 0) {
      setSubmitError('Giỏ hàng đang trống.');
      return;
    }

    const payload: CreateOrderRequest = pendingAttempt?.payload ?? {
      orderType: isQuoteOrder ? 'QUOTE_REQUEST' : 'ORDER',
      customerName: fullName.trim(),
      phone: phone.trim(),
      ...(address.trim() ? { address: address.trim() } : {}),
      ...(note.trim() || channel ? { note: [note.trim(), 'Kênh xác nhận: ' + channel].filter(Boolean).join('\n') } : {}),
      ...(!isQuoteOrder && voucherCode.trim() ? { voucherCode: voucherCode.trim().toUpperCase() } : {}),
      items: checkoutItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    };
    const key = pendingAttempt?.key ?? newIdempotencyKey();
    const attempt = { key, payload };
    submittingRef.current = true;
    setPendingAttempt(attempt);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      savePendingOrder(undefined, attempt);
      const receipt: OrderReceipt = await createOrder(payload, key);
      const orderRecord = {
        ...receipt,
        customer: { fullName: payload.customerName, phone: payload.phone, address: payload.address ?? '', channel, note: payload.note ?? '' },
        items: checkoutItems,
        shippingFee: 0,
      };
      rememberReceipt(receipt.orderCode, orderRecord);
      try {
        window.sessionStorage.setItem('hm_order_receipt_' + receipt.orderCode, JSON.stringify(orderRecord));
      } catch {
        // The next page reads the receipt from memory when storage is unavailable.
      }
      clearPendingOrder();
      clearQuoteDraft();
      submissionSucceededRef.current = true;
      setSubmissionSucceeded(true);
      setPendingAttempt(null);
      if (payload.orderType === 'ORDER' && JSON.stringify(payload.items) === JSON.stringify(items.map(({ variantId, quantity }) => ({ variantId, quantity })))) clearCart();
      router.push('/orders/' + receipt.orderCode);
    } catch (error) {
      const definitiveRejection = error instanceof ApiClientError
        && (error.status === 422 || (!pendingAttempt && [400, 401, 403, 404].includes(error.status)));
      if (definitiveRejection) {
        clearPendingOrder();
        setPendingAttempt(null);
        setSubmitError(apiMessage(error, 'Vui lòng kiểm tra lại thông tin.'));
      } else {
        setSubmitError('Chưa xác định được kết quả gửi đơn. Thử lại để kiểm tra yêu cầu đã gửi; thông tin của lần gửi này được giữ nguyên.');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!checkoutHydrated) return <div className="py-20 text-center text-text-muted">Đang tải phiếu đặt hàng...</div>;

  if (checkoutItems.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <div style={{ fontSize: 48 }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest-green)' }}>
          {isQuoteMode ? 'Chưa có sản phẩm báo giá' : 'Giỏ hàng của bạn đang trống'}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
          {isQuoteMode ? 'Vui lòng quay lại sản phẩm và chọn quy cách để gửi yêu cầu báo giá.' : 'Vui lòng chọn sản phẩm vào giỏ trước khi gửi phiếu đặt hàng.'}
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
          <span className="section-eyebrow">{isQuoteOrder ? 'Yêu cầu báo giá' : 'Kịch bản mua lẻ trực tiếp'}</span>
          <h2 className="section-title">Phiếu Đặt Hàng Nông Phẩm</h2>
        </div>
      </div>

      <div className="form-screen-wrap">
        {/* Selected Products Summary */}
        <div className="space-y-3 mb-5">
          {checkoutItems.map((item, idx) => (
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
                  {item.price == null ? 'Shop sẽ báo giá sau khi xác nhận' : formatCurrencyVnd(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Voucher Code Box */}
        {!isQuoteOrder && !pendingAttempt && <form onSubmit={handleApplyVoucher} className="mb-5 flex gap-2">
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
        </form>}

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
            <span>{formatCurrencyVnd(displaySubtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--peanut-bark)', fontWeight: 600 }}>
              <span>Chiết khấu mã giảm:</span>
              <span>- {formatCurrencyVnd(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Phí giao nhận:</span>
            <span>Shop xác nhận qua điện thoại</span>
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

        {submitError && (
          <div role="alert" style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14, background: '#FDF2F1', color: 'var(--error-crimson)', border: '1px solid var(--error-crimson)' }}>
            {submitError}
          </div>
        )}

        {/* Customer Information Form */}
        <form onSubmit={handleSubmitOrder}>
          {pendingAttempt && <p role="status" className="mb-4 text-sm">Đang kiểm tra yêu cầu đã gửi. Thử lại với cùng thông tin để tránh tạo đơn trùng.</p>}
          <fieldset disabled={Boolean(pendingAttempt)} style={{ border: 0, padding: 0, margin: 0 }}>
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
            <label className="form-field-label">Địa chỉ nhận hàng tận nơi (Tùy chọn)</label>
            <input
              type="text"
              className="form-field-input"
              placeholder="Số nhà, tên đường, xã/phường, quận/huyện, tỉnh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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

          </fieldset>
          <button
            type="submit"
            className="btn-action-touch fixed-flow"
            disabled={isSubmitting || submissionSucceeded}
            style={{ width: '100%', height: 46, fontSize: 14 }}
          >
            {isSubmitting ? 'Đang gửi yêu cầu...' : pendingAttempt ? 'Thử Lại Yêu Cầu Đã Gửi' : (isQuoteOrder ? 'Gửi Yêu Cầu Báo Giá' : 'Gửi Yêu Cầu Đặt Hàng')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Đang tải phiếu đặt hàng...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
