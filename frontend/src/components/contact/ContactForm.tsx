'use client';

import React, { useState } from 'react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  return (
    <div className="contact-form-card">
      <div className="contact-card-header">
        <h2 className="contact-card-title">Gửi Lời Nhắn Đến Xưởng Ép</h2>
        <p className="contact-card-sub">
          Điền thông tin bên dưới, hoặc liên hệ trực tiếp qua Hotline và Zalo để được hỗ trợ ngay.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="contact-form-body">
        <div className="contact-form-group">
          <label className="contact-form-label" htmlFor="contactName">
            Họ và tên của bạn <span className="req">*</span>
          </label>
          <input
            type="text"
            className="contact-form-input"
            id="contactName"
            placeholder="Ví dụ: Hoàng Minh"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="contact-form-row-2col">
          <div className="contact-form-group">
            <label className="contact-form-label" htmlFor="contactPhone">
              Số điện thoại <span className="req">*</span>
            </label>
            <input
              type="tel"
              className="contact-form-input"
              id="contactPhone"
              placeholder="0912 345 678"
              pattern="0[0-9]{9}"
              title="Vui lòng nhập 10 chữ số bắt đầu bằng số 0"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="contact-form-group">
            <label className="contact-form-label" htmlFor="contactEmail">
              Địa chỉ Email{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>
                (Không bắt buộc)
              </span>
            </label>
            <input
              type="email"
              className="contact-form-input"
              id="contactEmail"
              placeholder="ban@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="contact-form-group">
          <label className="contact-form-label" htmlFor="contactMsg">
            Nội dung cần tư vấn <span className="req">*</span>
          </label>
          <textarea
            className="contact-form-textarea"
            id="contactMsg"
            placeholder="Ví dụ: Tôi muốn hỏi về chính sách giá sỉ dầu mè đen nương đồi đóng thùng 12 chai..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>

        <div className="contact-form-helper">
          <span>🔒</span>
          <span>Thông tin của bạn được gửi trực tiếp đến ban điều hành xưởng và bảo mật tuyệt đối.</span>
        </div>

        {isSuccess && (
          <div className="contact-success-banner" role="status">
            <span>✓</span>
            <span>
              Đã gửi lời nhắn thành công! Xưởng sẽ liên hệ bạn qua số điện thoại/Zalo trong thời gian sớm nhất.
            </span>
          </div>
        )}

        <button
          type="submit"
          className="btn-contact-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span>⏳</span>
              <span>Đang gửi thông tin...</span>
            </>
          ) : isSuccess ? (
            <>
              <span>✓</span>
              <span>Đã Gửi Thành Công</span>
            </>
          ) : (
            <>
              <span>✈</span>
              <span>Gửi Thông Tin Cho Xưởng</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
