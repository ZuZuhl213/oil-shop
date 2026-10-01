import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Liên Hệ & Hỗ Trợ Đặt Hàng — HM Naturals',
  description: 'Liên hệ xưởng ép dầu lạc, mè đen nguyên bản HM Naturals tại Sơn Nam, Hưng Yên. Hotline tư vấn, Zalo xưởng trưởng và gửi lời nhắn đặt hàng.',
};

export default function ContactPage() {
  return (
    <div className="contact-view-container desktop-contact-container">
      {/* Hero / Header */}
      <div className="contact-hero-section desktop-contact-hero">
        <span className="contact-hero-eyebrow">
          <span>💬</span>
          <span>Kết Nối Cùng HM Naturals</span>
        </span>
        <h1 className="contact-hero-title">Liên Hệ &amp; Hỗ Trợ Đặt Hàng</h1>
        <p className="contact-hero-lead">
          Chúng tôi sẵn sàng lắng nghe mọi câu hỏi về sản phẩm, hướng dẫn chọn dầu hoặc đăng ký hợp đồng cung ứng số lượng lớn.
        </p>
      </div>

      {/* 2-Column Minimal Natural Premium Layout */}
      <div className="contact-layout-grid desktop-contact-layout">
        {/* Left Column: Direct Contact Info */}
        <div className="contact-info-card">
          <div className="contact-card-header">
            <h2 className="contact-card-title">Kênh Liên Lạc Trực Tiếp</h2>
            <p className="contact-card-sub">
              Kết nối nhanh với xưởng ép để nhận tư vấn nguyên bản và chính sách giá tốt nhất.
            </p>
          </div>

          <div className="contact-items-list">
            {/* Hotline */}
            <div className="contact-item-row">
              <div className="contact-item-icon" aria-hidden="true">
                📞
              </div>
              <div className="contact-item-content">
                <span className="contact-item-label">HOTLINE XƯỞNG</span>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                  className="contact-item-value"
                >
                  {siteConfig.phone}
                </a>
                <span className="contact-item-note">
                  Hỗ trợ 8:00 – 21:00 hàng ngày, cuộc gọi trực tiếp
                </span>
              </div>
            </div>

            {/* Zalo */}
            <div className="contact-item-row">
              <div className="contact-item-icon" aria-hidden="true">
                💬
              </div>
              <div className="contact-item-content">
                <span className="contact-item-label">TƯ VẤN ZALO</span>
                <a
                  href={siteConfig.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-item-value"
                >
                  Chat Cùng Xưởng Trưởng
                </a>
                <span className="contact-item-note">
                  Phản hồi nhanh trong 15 phút, gửi ảnh mẻ ép vụ mới
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="contact-item-row">
              <div className="contact-item-icon" aria-hidden="true">
                ✉️
              </div>
              <div className="contact-item-content">
                <span className="contact-item-label">HÒM THƯ ĐIỆN TỬ</span>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="contact-item-value"
                >
                  {siteConfig.email}
                </a>
                <span className="contact-item-note">
                  Báo giá đại lý, hợp đồng bếp ăn &amp; đối tác phân phối
                </span>
              </div>
            </div>

            {/* Workshop Address */}
            <div className="contact-item-row">
              <div className="contact-item-icon" aria-hidden="true">
                📍
              </div>
              <div className="contact-item-content">
                <span className="contact-item-label">ĐỊA CHỈ CƠ SỞ</span>
                <span className="contact-item-value">
                  {siteConfig.address}
                </span>
                <span className="contact-item-note">
                  Vùng bãi bồi nông sản bản địa thuần nông
                </span>
              </div>
            </div>
          </div>

          {/* Visiting hours box */}
          <div className="contact-schedule-box">
            <strong>⏰ Thời Gian Làm Việc &amp; Tiếp Khách:</strong>
            Thứ Hai – Thứ Bảy: 8:00 – 17:30. Quý khách vui lòng gọi trước 30 phút để xưởng chuẩn bị đón tiếp chu đáo nhất.
          </div>
        </div>

        {/* Right Column: Contact Form Component */}
        <ContactForm />
      </div>
    </div>
  );
}

