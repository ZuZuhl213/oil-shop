'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/config/site';
import { Phone, Mail, MapPin, MessageSquare, Send, Clock, Info } from 'lucide-react';

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-soft-sand bg-white text-sm text-dark-cocoa placeholder:text-text-muted/60 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/15 transition-all';

export default function ContactPage() {
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  // ponytail: no contact API yet — submit only surfaces direct channels, never fakes a "sent" receipt.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedName(formData.name.trim() || null);
  };

  const contactChannels = [
    {
      href: `tel:${siteConfig.phone.replace(/\s/g, '')}`,
      icon: Phone,
      iconWrap: 'bg-forest-green/10 text-forest-green',
      label: 'Hotline xưởng',
      value: siteConfig.phone,
      sub: 'Hỗ trợ 8:00 – 21:00 hàng ngày',
    },
    {
      href: siteConfig.zalo,
      icon: MessageSquare,
      iconWrap: 'bg-peanut-gold/15 text-peanut-bark',
      label: 'Tư vấn Zalo',
      value: 'Chat cùng Xưởng Trưởng',
      sub: 'Phản hồi nhanh trong 15 phút',
      external: true,
    },
    {
      href: `mailto:${siteConfig.email}`,
      icon: Mail,
      iconWrap: 'bg-forest-green/10 text-forest-green',
      label: 'Hòm thư điện tử',
      value: siteConfig.email,
      sub: 'Báo giá đại lý & đối tác phân phối',
    },
  ];

  return (
    <div className="site-container py-12 sm:py-16 lg:py-20 space-y-10">
      {/* ── Header ── */}
      <header className="max-w-2xl space-y-4">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-green/10 text-forest-green text-xs font-semibold tracking-wide">
          <MessageSquare className="w-3.5 h-3.5 text-peanut-gold" />
          Kết nối cùng HM Naturals
        </span>
        <h1 className="font-display text-[2rem] sm:text-4xl font-extrabold text-forest-green leading-[1.12] tracking-tight">
          Liên Hệ &amp; Hỗ Trợ Đặt Hàng
        </h1>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          Chúng tôi sẵn sàng lắng nghe mọi câu hỏi về sản phẩm, hướng dẫn chọn dầu hoặc đăng ký hợp đồng cung ứng số lượng lớn.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ── Left: Contact channels ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-soft-sand p-6 space-y-4 shadow-md">
            <h2 className="font-display font-bold text-lg text-forest-green">Kênh Liên Lạc Trực Tiếp</h2>
            <div className="space-y-2.5">
              {contactChannels.map(({ href, icon: Icon, iconWrap, label, value, sub, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-soft-sand/50 hover:border-forest-green/30 hover:bg-forest-green/5 transition-all no-underline text-inherit group min-h-[44px]"
                >
                  <div className={`w-11 h-11 rounded-xl ${iconWrap} grid place-items-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{label}</div>
                    <div className="font-bold text-dark-cocoa text-sm mt-0.5 group-hover:text-forest-green transition-colors break-words">
                      {value}
                    </div>
                    <span className="text-[11px] text-text-muted">{sub}</span>
                  </div>
                </a>
              ))}

              {/* Address — not a link */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-soft-sand/50">
                <div className="w-11 h-11 rounded-xl bg-forest-green/10 text-forest-green grid place-items-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Địa chỉ cơ sở</div>
                  <div className="font-medium text-dark-cocoa text-[13px] mt-0.5">{siteConfig.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-soft-sand p-6 shadow-md">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-lg bg-peanut-gold/15 grid place-items-center shrink-0">
                <Clock className="w-4 h-4 text-peanut-gold" />
              </div>
              <h3 className="font-display font-bold text-base text-forest-green">Thời Gian Tiếp Khách</h3>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">
              Thứ Hai – Thứ Bảy: 8:00 – 17:30. Quý khách vui lòng gọi trước 30 phút để xưởng chuẩn bị đón tiếp chu đáo nhất.
            </p>
          </div>
        </div>

        {/* ── Right: Contact form ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-soft-sand p-6 sm:p-8 shadow-md">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-forest-green mb-1.5">
            Gửi Lời Nhắn Đến Xưởng Ép
          </h2>
          <p className="text-[13px] text-text-muted mb-6 leading-relaxed">
            Điền thông tin bên dưới, hoặc liên hệ trực tiếp qua Hotline và Zalo để được hỗ trợ ngay.
          </p>

          {submittedName !== null ? (
            <div className="p-6 sm:p-7 space-y-4 bg-peanut-gold-surface rounded-2xl border border-peanut-gold/40">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-peanut-gold/20 text-peanut-bark grid place-items-center mx-0 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-forest-green">
                    {submittedName ? `Cảm ơn ${submittedName}!` : 'Cảm ơn bạn đã quan tâm!'}
                  </h3>
                  <p className="text-[13px] text-text-muted leading-relaxed">
                    Biểu mẫu này hiện chưa kết nối hệ thống gửi tự động. Để được hỗ trợ ngay, vui lòng liên hệ trực tiếp với xưởng qua các kênh dưới đây.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                  className="flex-1 h-12 px-4 rounded-xl bg-forest-green hover:bg-forest-green-dark text-warm-cream text-sm font-semibold no-underline transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Gọi {siteConfig.phone}
                </a>
                <a
                  href={siteConfig.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-12 px-4 rounded-xl bg-white border border-soft-sand hover:border-forest-green/40 text-dark-cocoa text-sm font-semibold no-underline transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-peanut-bark" />
                  Nhắn Zalo
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSubmittedName(null)}
                className="text-[13px] text-forest-green font-semibold underline underline-offset-2 cursor-pointer"
              >
                ← Quay lại biểu mẫu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="c-name" className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                  Họ và tên của bạn <span className="text-error-crimson">*</span>
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Hoàng Minh"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="c-phone" className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                    Số điện thoại <span className="text-error-crimson">*</span>
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    required
                    pattern="0[0-9]{9}"
                    title="Vui lòng nhập 10 chữ số bắt đầu bằng 0"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                    Địa chỉ Email
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ban@email.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="c-message" className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                  Nội dung cần tư vấn <span className="text-error-crimson">*</span>
                </label>
                <textarea
                  id="c-message"
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ví dụ: Tôi muốn hỏi về chính sách giá sỉ dầu mè đen nương đồi đóng thùng 12 chai..."
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-white text-sm text-dark-cocoa placeholder:text-text-muted/60 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/15 transition-all resize-y min-h-[112px]"
                />
              </div>

              <p className="text-[11px] text-text-muted flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-peanut-bark" />
                Biểu mẫu đang trong giai đoạn hoàn thiện — sau khi gửi, xưởng sẽ hiển thị kênh liên hệ trực tiếp để hỗ trợ bạn nhanh nhất.
              </p>

              <button
                type="submit"
                className="w-full h-12 px-6 rounded-xl bg-forest-green hover:bg-forest-green-dark text-warm-cream font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Gửi Thông Tin Cho Xưởng
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
