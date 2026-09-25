'use client';

import React from 'react';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { MapPin, Phone, MessageSquare, Mail, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <>
      {/* ── Mobile Footer (< lg) ── */}
      <footer className="app-footer-mobile bg-forest-green-dark text-warm-cream border-t border-peanut-gold/25 pt-8 pb-10 px-5" role="contentinfo">
        <div className="space-y-6">
          {/* Brand Row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-forest-green border border-peanut-gold/40 text-peanut-gold grid place-items-center font-display font-bold text-sm shadow-sm">
              HM
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base text-warm-cream tracking-wide">
                HM NATURALS
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-peanut-gold">
                Dầu Nông Sản Nguyên Bản
              </span>
            </div>
          </div>

          <p className="text-xs text-warm-cream/80 leading-relaxed">
            Dầu ăn ép cơ học nguyên bản từ đậu phộng sẻ và mè đen bản địa. Không tinh luyện hóa chất, lưu giữ trọn vẹn vị mộc truyền thống.
          </p>

          {/* Quick Contact Buttons (Strict 44px touch) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
              className="min-h-[44px] px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-warm-cream text-xs font-semibold flex items-center justify-center gap-2 no-underline transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-peanut-gold" />
              <span>Gọi Xưởng</span>
            </a>
            <a
              href={siteConfig.zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3 rounded-xl bg-peanut-gold hover:bg-peanut-gold/90 text-white text-xs font-semibold flex items-center justify-center gap-2 no-underline transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Nhắn Zalo</span>
            </a>
          </div>

          {/* Navigation links pills */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-xs">
            <Link href="/products" className="text-warm-cream/80 hover:text-peanut-gold no-underline transition-colors py-1">
              Sản phẩm
            </Link>
            <span className="text-warm-cream/30 py-1">•</span>
            <Link href="/knowledge" className="text-warm-cream/80 hover:text-peanut-gold no-underline transition-colors py-1">
              Kiến thức
            </Link>
            <span className="text-warm-cream/30 py-1">•</span>
            <Link href="/about" className="text-warm-cream/80 hover:text-peanut-gold no-underline transition-colors py-1">
              Về xưởng
            </Link>
            <span className="text-warm-cream/30 py-1">•</span>
            <Link href="/tracking" className="text-warm-cream/80 hover:text-peanut-gold no-underline transition-colors py-1">
              Tra cứu đơn
            </Link>
            <span className="text-warm-cream/30 py-1">•</span>
            <Link href="/contact" className="text-warm-cream/80 hover:text-peanut-gold no-underline transition-colors py-1">
              Liên hệ
            </Link>
          </div>

          {/* Mobile Copyright */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-warm-cream/60 flex flex-col gap-1">
            <div>© {new Date().getFullYear()} HM NATURALS. Thuần nông bản địa Việt Nam.</div>
            <div>Cơ sở sản xuất: Nam Đàn, Nghệ An</div>
          </div>
        </div>
      </footer>

      {/* ── Desktop Footer (>= lg) ── */}
      <footer className="app-footer-desktop bg-forest-green-dark text-warm-cream border-t border-peanut-gold/25 pt-16 pb-12" role="contentinfo">
        <div className="site-container">
          <div className="grid grid-cols-12 gap-10 lg:gap-12">
            {/* Column 1: Brand & Craftsmanship Philosophy (5 cols) */}
            <div className="col-span-5 space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-forest-green border border-peanut-gold/40 text-peanut-gold grid place-items-center font-display font-bold text-lg shadow-sm">
                  HM
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xl text-warm-cream tracking-wide">
                    HM NATURALS
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peanut-gold">
                    DẦU NÔNG SẢN NGUYÊN BẢN
                  </span>
                </div>
              </div>

              <p className="text-sm text-warm-cream/80 leading-[1.75] max-w-[26rem]">
                Dầu ăn ép cơ học nguyên bản từ nguồn đậu phộng sẻ và mè đen bản địa. Không tinh luyện hóa chất, giữ trọn sắc sánh và hương vị mộc mạc cho gian bếp gia đình.
              </p>

              {/* Craftsmanship badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-peanut-gold font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% Nông Sản Thuần Bản Địa
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-peanut-gold font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ép Cơ Học Mộc Cối Đá
                </span>
              </div>
            </div>

            {/* Column 2: Navigation Links (3 cols) */}
            <div className="col-span-3 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-[0.16em] text-peanut-gold">
                Khám Phá Tuyển Phẩm
              </h4>
              <ul className="space-y-3 text-sm text-warm-cream/80 list-none p-0 m-0">
                <li>
                  <Link href="/" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Trang Chủ
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Tuyển Phẩm Vụ Mùa
                  </Link>
                </li>
                <li>
                  <Link href="/knowledge" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Góc Kiến Thức Dầu Lành
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Ba Nguyên Tắc Sản Xuất
                  </Link>
                </li>
                <li>
                  <Link href="/tracking" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Tra Cứu Tiến Độ Đơn
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1.5 group">
                    <span className="text-peanut-gold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    Liên Hệ &amp; Tiếp Khách
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Workshop Contact & Direct Order Channels (4 cols) */}
            <div className="col-span-4 space-y-4">
              <h4 className="font-display font-bold text-xs uppercase tracking-[0.16em] text-peanut-gold">
                Cơ Sở &amp; Hỗ Trợ Trực Tiếp
              </h4>
              <div className="space-y-3.5 text-sm text-warm-cream/85">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-peanut-gold grid place-items-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="leading-snug">
                    Cơ sở sản xuất &amp; ép dầu tự nhiên Nam Đàn, Nghệ An
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-peanut-gold grid place-items-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-warm-cream/60 block">Hotline xưởng:</span>
                    <a
                      href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                      className="font-bold text-warm-cream hover:text-peanut-gold transition-colors no-underline text-base"
                    >
                      {siteConfig.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-peanut-gold grid place-items-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-warm-cream/60 block">Tư vấn trực tiếp:</span>
                    <a
                      href={siteConfig.zalo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-warm-cream hover:text-peanut-gold transition-colors no-underline inline-flex items-center gap-1 text-sm"
                    >
                      <span>Kết nối Zalo Xưởng Trưởng</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-peanut-gold" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-peanut-gold grid place-items-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-warm-cream/60 block">Hòm thư xưởng:</span>
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-warm-cream hover:text-peanut-gold transition-colors no-underline text-sm"
                    >
                      {siteConfig.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Principles */}
          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-warm-cream/60 gap-4">
            <div>
              © {new Date().getFullYear()} HM NATURALS. Gìn giữ hạt nông sản thuần bản địa Việt Nam.
            </div>
            <div className="flex items-center gap-4 text-warm-cream/50">
              <span>Ép cơ học chậm</span>
              <span>•</span>
              <span>Lọc vải mộc 48h</span>
              <span>•</span>
              <span>Chai thủy tinh hổ phách</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
