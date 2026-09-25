'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export function MobileNavDrawer() {
  const { isNavOpen, closeNav } = useCart();
  const pathname = usePathname();

  if (!isNavOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-drawer-backdrop ${isNavOpen ? 'open' : ''}`}
        onClick={closeNav}
        aria-hidden="true"
      />

      {/* Nav Drawer Slide-over */}
      <aside
        className={`cart-drawer nav-drawer ${isNavOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <Link href="/" className="drawer-brand" onClick={closeNav}>
            <div className="brand-icon" style={{ width: 34, height: 34, fontSize: 15 }} aria-hidden="true">
              HM
            </div>
            <div className="brand-text-wrap">
              <span className="brand-text-name" style={{ fontSize: 17 }}>HM NATURALS</span>
              <span className="brand-text-tagline" style={{ fontSize: 8 }}>DẦU NÔNG SẢN NGUYÊN BẢN</span>
            </div>
          </Link>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeNav}
            aria-label="Đóng menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="drawer-nav-body" aria-label="Danh mục điều hướng">
          <Link
            href="/"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">🏡</span>
              <div>
                <div>Trang Chủ</div>
                <div style={{ fontSize: 11, opacity: pathname === '/' ? 0.9 : 0.6 }}>Cửa hàng &amp; Tuyển phẩm vụ mới</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/products"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/products' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">🫒</span>
              <div>
                <div>Danh Mục Sản Phẩm</div>
                <div style={{ fontSize: 11, opacity: pathname === '/products' ? 0.9 : 0.6 }}>Tất cả sản phẩm &amp; tìm kiếm</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/products/dau-sachi-ep-song"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/products/dau-sachi-ep-song' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">📦</span>
              <div>
                <div>Báo Giá Sỉ &amp; Đại Lý</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Sachi &amp; Phụ phẩm ép khô</div>
              </div>
            </div>
            <span className="drawer-row-badge">Sỉ</span>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/knowledge"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname.startsWith('/knowledge') ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">📖</span>
              <div>
                <div>Góc Kiến Thức</div>
                <div style={{ fontSize: 11, opacity: pathname.startsWith('/knowledge') ? 0.9 : 0.6 }}>Cẩm nang chọn dầu &amp; điểm khói</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/tracking"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/tracking' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">🔍</span>
              <div>
                <div>Tra Cứu Đơn Hàng</div>
                <div style={{ fontSize: 11, opacity: pathname === '/tracking' ? 0.9 : 0.6 }}>Khách vãng lai không cần tài khoản</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/about"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/about' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">ℹ️</span>
              <div>
                <div>Về Chúng Tôi</div>
                <div style={{ fontSize: 11, opacity: pathname === '/about' ? 0.9 : 0.6 }}>Quy trình ép mộc &amp; cơ sở xưởng</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>

          <Link
            href="/contact"
            onClick={closeNav}
            className={`drawer-nav-row ${pathname === '/contact' ? 'active' : ''}`}
          >
            <div className="drawer-row-left">
              <span className="drawer-row-icon">📞</span>
              <div>
                <div>Liên Hệ Xưởng</div>
                <div style={{ fontSize: 11, opacity: pathname === '/contact' ? 0.9 : 0.6 }}>Đường dây nóng &amp; địa chỉ xưởng</div>
              </div>
            </div>
            <span className="drawer-row-arrow">›</span>
          </Link>
        </nav>

        {/* Drawer Bottom Contact / Action Card */}
        <div className="drawer-footer-card">
          <div className="drawer-contact-head">
            <span className="drawer-contact-eyebrow">XƯỞNG ÉP TỰ NHIÊN</span>
            <span className="drawer-contact-title">Tư Vấn &amp; Đặt Hàng Trực Tiếp</span>
          </div>
          <div className="drawer-quick-actions">
            <a href="tel:0912345678" className="drawer-contact-btn">
              <span>📞</span> <span>Gọi Hotline</span>
            </a>
            <a href="https://zalo.me/0912345678" target="_blank" rel="noopener noreferrer" className="drawer-contact-btn">
              <span>💬</span> <span>Nhắn Zalo</span>
            </a>
          </div>
          <Link
            href="/products/dau-lac-nguyen-chat"
            onClick={closeNav}
            className="drawer-primary-cta"
          >
            <span>🌿</span> <span>Đặt Mua Dầu Lạc Mộc</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
