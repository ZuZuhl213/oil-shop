'use client';

import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <>
      {/* ── Mobile Footer (< lg) ── */}
      <footer className="lg:hidden app-footer" role="contentinfo">
        <div className="footer-brand">{siteConfig.name.toUpperCase()}</div>
        <p>Cơ sở sản xuất &amp; ép dầu tự nhiên Nam Đàn, Nghệ An</p>
        <p style={{ marginTop: 4 }}>
          Hỗ trợ tư vấn đặt hàng và báo giá sỉ trực tiếp qua Zalo và Hotline xưởng: <strong>0912 345 678</strong>
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11 }}>
          <Link href="/tracking" style={{ color: 'var(--forest-green)', fontWeight: 600 }}>Tra cứu đơn hàng</Link>
          <span>•</span>
          <Link href="/knowledge" style={{ color: 'var(--forest-green)', fontWeight: 600 }}>Góc kiến thức</Link>
          <span>•</span>
          <Link href="/contact" style={{ color: 'var(--forest-green)', fontWeight: 600 }}>Liên hệ xưởng</Link>
        </div>
      </footer>

      {/* ── Desktop Footer (>= lg) ── */}
      <footer className="hidden lg:block bg-[#EAE2D6] border-t border-soft-sand py-12" role="contentinfo">
        <div className="site-container">
          <div className="grid grid-cols-4 gap-10">
            {/* Column 1: Brand Lockup */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="brand-icon" style={{ width: 36, height: 36, fontSize: 16 }}>
                  HM
                </div>
                <div className="flex flex-col">
                  <span className="brand-text-name" style={{ fontSize: 20 }}>HM NATURALS</span>
                  <span className="brand-text-tagline" style={{ fontSize: 9.5 }}>DẦU NÔNG SẢN NGUYÊN BẢN</span>
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed max-w-md">
                Dầu ăn ép cơ học nguyên bản từ nguồn đậu phộng sẻ và mè đen bản địa. Không tinh luyện hóa chất, giữ trọn sắc sánh và hương vị mộc mạc cho gian bếp gia đình.
              </p>
              <div className="pt-1">
                <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-forest-green/10 text-forest-green font-semibold">
                  🌿 100% Nông Sản Bản Địa Thuần Chủng
                </span>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div>
              <h4 className="font-display font-bold text-sm text-forest-green uppercase tracking-wider mb-4">
                Khám Phá
              </h4>
              <ul className="space-y-2.5 text-sm text-text-muted list-none p-0 m-0">
                <li><Link href="/" className="hover:text-forest-green transition-colors no-underline">Trang Chủ</Link></li>
                <li><Link href="/products" className="hover:text-forest-green transition-colors no-underline">Tuyển Phẩm Vụ Mùa</Link></li>
                <li><Link href="/knowledge" className="hover:text-forest-green transition-colors no-underline">Góc Kiến Thức Dầu Lành</Link></li>
                <li><Link href="/about" className="hover:text-forest-green transition-colors no-underline">Ba Nguyên Tắc Sản Xuất</Link></li>
                <li><Link href="/tracking" className="hover:text-forest-green transition-colors no-underline">Tra Cứu Tiến Độ Đơn</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact & Workshop */}
            <div>
              <h4 className="font-display font-bold text-sm text-forest-green uppercase tracking-wider mb-4">
                Xưởng Sản Xuất
              </h4>
              <div className="space-y-2.5 text-sm text-text-muted">
                <p>📍 Cơ sở sản xuất &amp; ép dầu tự nhiên Nam Đàn, Nghệ An</p>
                <p>📞 Hotline xưởng: <a href="tel:0912345678" className="font-semibold text-forest-green no-underline">0912 345 678</a></p>
                <p>💬 Zalo tư vấn: <a href="https://zalo.me/0912345678" target="_blank" rel="noopener noreferrer" className="font-semibold text-forest-green no-underline">0912 345 678</a></p>
                <p>✉️ Email: lienhe@hmnaturals.vn</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-soft-sand flex items-center justify-between text-xs text-text-muted">
            <div>
              © {new Date().getFullYear()} HM NATURALS. Gìn giữ hạt nông sản thuần bản địa Việt Nam.
            </div>
            <div>
              Ép cơ học chậm • Lọc vải mộc 48h • Chai thủy tinh hổ phách
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
