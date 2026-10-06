'use client';

import React, { useState } from 'react';
import { trackOrder } from '@/lib/api/orders';
import type { OrderTracking } from '@/lib/api/contracts/types';
import { ApiClientError } from '@/lib/api/client';
import { formatCurrencyVnd } from '@/lib/format/currency';

export default function OrderTrackingSearchPage() {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = orderCode.trim().toUpperCase();
    const trimmedPhone = phone.trim();

    if (!trimmedCode || !trimmedPhone) {
      setErrorMessage('Vui lòng nhập đầy đủ mã yêu cầu đơn hàng và số điện thoại đặt hàng.');
      return;
    }

    setErrorMessage('');
    setResult(null);
    setIsLoading(true);
    trackOrder(trimmedCode, trimmedPhone)
      .then(setResult)
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiClientError && error.code === 'ORDER_NOT_FOUND'
          ? 'Không tìm thấy đơn hàng với mã và số điện thoại này.'
          : 'Không thể tra cứu lúc này. Vui lòng thử lại sau.');
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="site-container py-4 pb-20">
      <div className="home-section-head" style={{ paddingTop: 14 }}>
        <div>
          <span className="section-eyebrow">Dành cho khách vãng lai</span>
          <h2 className="section-title">Tra Cứu Đơn Hàng</h2>
        </div>
      </div>

      <div className="form-screen-wrap">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 16 }}>
          Hệ thống không yêu cầu tài khoản. Bạn vui lòng nhập mã yêu cầu đơn hàng và số điện thoại đã sử dụng khi gửi yêu cầu để kiểm tra trạng thái xử lý từ xưởng.
        </p>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              background: '#FDF2F1',
              border: '1px solid #E4B8B4',
              color: 'var(--error-crimson)',
              marginBottom: 14,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLookup}>
          <div className="form-row-group">
            <label className="form-field-label">Mã yêu cầu đơn hàng *</label>
            <input
              type="text"
              className="form-field-input"
              placeholder="Ví dụ: HMN-2026-9812"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, textTransform: 'uppercase' }}
              required
            />
          </div>

          <div className="form-row-group">
            <label className="form-field-label">Số điện thoại đặt hàng *</label>
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

          <button
            type="submit"
            className="btn-action-touch fixed-flow"
            style={{ width: '100%', height: 46, fontSize: 14, marginTop: 6 }}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tra cứu...' : 'Tra Cứu Đơn Hàng'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: 24, padding: 16, background: 'var(--white-pure)', border: '1px solid var(--soft-sand)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <strong style={{ color: 'var(--forest-green)' }}>{result.orderCode}</strong>
              <span style={{ fontWeight: 700, color: 'var(--peanut-bark)' }}>{result.status}</span>
            </div>
            <p style={{ margin: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Tạo lúc {new Date(result.createdAt).toLocaleString('vi-VN')}
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {result.items.map((item, index) => (
                <div key={`${item.productName}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                  <span>{item.productName}{item.variantName ? ` / ${item.variantName}` : ''} × {item.quantity}</span>
                  <strong>{item.lineTotal == null ? 'Báo giá sau' : formatCurrencyVnd(item.lineTotal)}</strong>
                </div>
              ))}
            </div>
            {result.totalAmount != null && (
              <div style={{ borderTop: '1px solid var(--soft-sand)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Tổng tiền</span><span>{formatCurrencyVnd(result.totalAmount)}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, padding: '14px', background: 'var(--white-pure)', border: '1px solid var(--soft-sand)', borderRadius: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Nhập mã đơn và số điện thoại đã dùng khi đặt hàng để xem trạng thái mới nhất.
        </div>
      </div>
    </div>
  );
}
