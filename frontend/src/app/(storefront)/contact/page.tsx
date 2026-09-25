'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/config/site';
import { Phone, Mail, MapPin, MessageSquare, Send, CheckCircle2, Clock } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
    <div className="site-container py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-green/10 text-forest-green text-xs font-semibold tracking-wide">
          <MessageSquare className="w-3.5 h-3.5 text-peanut-gold" />
          <span>Kết nối cùng HM Naturals</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-forest-green leading-tight">
          Liên Hệ &amp; Hỗ Trợ Đặt Hàng
        </h1>
        <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
          Chúng tôi sẵn sàng lắng nghe mọi câu hỏi về sản phẩm, hướng dẫn chọn dầu hoặc đăng ký hợp đồng cung ứng số lượng lớn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-soft-sand/60 p-5 sm:p-6 space-y-4 shadow-sm">
            <h2 className="font-display font-bold text-base text-forest-green">
              Kênh Liên Lạc Trực Tiếp
            </h2>

            <div className="space-y-2.5">
              {contactChannels.map(({ href, icon: Icon, iconWrap, label, value, sub, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F7F3EE] hover:bg-forest-green/6 border border-transparent hover:border-soft-sand/50 transition-all no-underline text-inherit group"
                >
                  <div className={`w-10 h-10 rounded-xl ${iconWrap} grid place-items-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{label}</div>
                    <div className="font-bold text-dark-cocoa text-sm mt-0.5 group-hover:text-forest-green transition-colors">{value}</div>
                    <span className="text-[11px] text-text-muted">{sub}</span>
                  </div>
                </a>
              ))}

              {/* Address — not a link */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#F7F3EE]">
                <div className="w-10 h-10 rounded-xl bg-forest-green/10 text-forest-green grid place-items-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Địa chỉ cơ sở</div>
                  <div className="font-medium text-dark-cocoa text-[13px] mt-0.5">{siteConfig.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-soft-sand/60 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-peanut-gold/15 grid place-items-center">
                <Clock className="w-4 h-4 text-peanut-gold" />
              </div>
              <h3 className="font-display font-bold text-sm text-forest-green">
                Thời Gian Tiếp Khách
              </h3>
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed">
              Thứ Hai – Thứ Bảy: 8:00 – 17:30. Quý khách vui lòng gọi trước 30 phút để xưởng chuẩn bị đón tiếp chu đáo nhất.
            </p>
          </div>
        </div>

        {/* Contact Message Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-soft-sand/60 p-6 sm:p-8 shadow-sm">
          <h2 className="font-display font-bold text-xl text-forest-green mb-1.5">
            Gửi Lời Nhắn Đến Xưởng Ép
          </h2>
          <p className="text-[13px] text-text-muted mb-6">
            Điền thông tin bên dưới, nhân viên hỗ trợ của chúng tôi sẽ liên hệ lại với bạn sớm nhất.
          </p>

          {submitted ? (
            <div className="p-8 text-center space-y-3 bg-forest-green/5 rounded-2xl border border-forest-green/15">
              <div className="w-14 h-14 rounded-full bg-forest-green text-warm-cream grid place-items-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-forest-green">
                Đã gửi lời nhắn thành công!
              </h3>
              <p className="text-[13px] text-text-muted max-w-sm mx-auto leading-relaxed">
                Cảm ơn bạn đã quan tâm. Chúng tôi sẽ phản hồi lại bạn qua số điện thoại hoặc email trong vòng 24 giờ.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 rounded-xl bg-forest-green text-warm-cream text-[13px] font-semibold hover:bg-forest-green-dark transition-colors cursor-pointer shadow-sm"
              >
                Gửi Lời Nhắn Khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                  Họ và tên của bạn <span className="text-error-crimson">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Hoàng Minh"
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-[#F7F3EE] text-sm focus:border-forest-green focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                    Số điện thoại <span className="text-error-crimson">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="0[0-9]{9}"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-[#F7F3EE] text-sm focus:border-forest-green focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ban@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-[#F7F3EE] text-sm focus:border-forest-green focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-dark-cocoa block mb-1.5">
                  Nội dung cần tư vấn <span className="text-error-crimson">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Ví dụ: Tôi muốn hỏi về chính sách giá sỉ dầu mè đen nương đồi đóng thùng 12 chai..."
                  className="w-full px-4 py-3 rounded-xl border border-soft-sand bg-[#F7F3EE] text-sm focus:border-forest-green focus:bg-white focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-forest-green hover:bg-forest-green-dark text-warm-cream font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi Thông Tin Cho Xưởng</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
