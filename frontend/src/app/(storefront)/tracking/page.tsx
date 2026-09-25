'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderTrackingSearchPage() {
  const router = useRouter();
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = orderCode.trim().toUpperCase();
    const trimmedPhone = phone.trim();

    if (!trimmedCode || !trimmedPhone) {
      setErrorMessage('Vui lòng nhập đầy đủ mã yêu cầu đơn hàng và số điện thoại đặt hàng.');
      return;
    }

    setErrorMessage('');
    router.push(`/orders/${trimmedCode}`);
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
          >
            Tra Cứu Đơn Hàng
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px', background: 'var(--white-pure)', border: '1px solid var(--soft-sand)', borderRadius: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <strong>💡 Mã đơn thử nghiệm:</strong> Bạn có thể dùng mã{' '}
          <button
            type="button"
            onClick={() => {
              setOrderCode('HMN-2026-9812');
              setPhone('0912345678');
            }}
            style={{ color: 'var(--forest-green)', fontWeight: 700, textDecoration: 'underline', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            HMN-2026-9812
          </button>{' '}
          để xem trực tiếp giao diện biên nhận và quy trình 5 bước.
        </div>
      </div>
    </div>
  );
}
