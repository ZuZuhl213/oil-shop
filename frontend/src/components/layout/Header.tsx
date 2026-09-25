'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, openCart, openNav } = useCart();
  const [searchKeyword, setSearchKeyword] = useState('');

  // Handle Cmd+K keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('desktopSearchInput');
        if (input) {
          input.focus();
        } else {
          router.push('/products');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <>
      {/* ── 1. Desktop Top Announcement Bar ── */}
      <div className="desktop-top-bar" role="region" aria-label="Thông báo xưởng">
        <div className="desktop-top-bar-inner">
          <span>🌿 <b>HM NATURALS:</b> Dầu thực vật ép cơ học nguyên bản từ nông sản bản địa Việt Nam</span>
          <span>Cơ sở sản xuất &amp; ép dầu tự nhiên Nam Đàn, Nghệ An</span>
        </div>
      </div>

      {/* ── 2. Desktop Sticky Header & Navbar ── */}
      <header className="desktop-header" role="banner">
        <div className="desktop-header-main">
          {/* Brand lockup */}
          <Link href="/" className="desktop-brand-lockup" aria-label="HM NATURALS Trang Chủ">
            <div className="brand-icon" style={{ width: 36, height: 36, fontSize: 16 }} aria-hidden="true">
              HM
            </div>
            <div className="brand-text-wrap">
              <span className="brand-text-name" style={{ fontSize: 19 }}>HM NATURALS</span>
              <span className="brand-text-tagline" style={{ fontSize: 9 }}>DẦU NÔNG SẢN NGUYÊN BẢN</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-wrap" aria-label="Menu điều hướng Desktop">
            <ul className="desktop-nav-menu">
              <li>
                <Link
                  href="/"
                  className={`desktop-nav-link ${pathname === '/' ? 'active' : ''}`}
                >
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className={`desktop-nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}
                >
                  Sản Phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/knowledge"
                  className={`desktop-nav-link ${pathname.startsWith('/knowledge') ? 'active' : ''}`}
                >
                  Góc Kiến Thức
                </Link>
              </li>
              <li>
                <Link
                  href="/products/dau-sachi-ep-song"
                  className={`desktop-nav-link ${pathname === '/products/dau-sachi-ep-song' ? 'active' : ''}`}
                >
                  Báo Giá Sỉ
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className={`desktop-nav-link ${pathname === '/about' ? 'active' : ''}`}
                >
                  Quy Trình
                </Link>
              </li>
              <li>
                <Link
                  href="/tracking"
                  className={`desktop-nav-link ${pathname === '/tracking' ? 'active' : ''}`}
                >
                  Tra Cứu Đơn
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className={`desktop-nav-link ${pathname === '/contact' ? 'active' : ''}`}
                >
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </nav>

          {/* Desktop Right Actions Cluster */}
          <div className="desktop-actions-cluster">
            {/* Search Input Box with Cmd+K */}
            <form onSubmit={handleSearchSubmit} className="desktop-search-box">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="desktopSearchInput"
                type="text"
                placeholder="Tìm nông phẩm..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 13,
                  width: '100%',
                  color: 'var(--dark-cocoa)',
                }}
              />
              <kbd style={{
                fontSize: 10,
                background: 'var(--warm-cream)',
                padding: '2px 5px',
                borderRadius: 4,
                border: '1px solid var(--soft-sand)',
                color: 'var(--text-muted)',
              }}>
                ⌘K
              </kbd>
            </form>

            {/* Cart Button */}
            <button
              type="button"
              className="desktop-cart-btn"
              onClick={openCart}
              aria-label={`Mở giỏ hàng (${totalItems} sản phẩm)`}
            >
              <span>🛒</span>
              <span>Giỏ Hàng</span>
              <span style={{
                background: 'var(--forest-green)',
                color: '#FFF',
                padding: '2px 7px',
                borderRadius: 99,
                fontSize: 11,
              }}>
                {totalItems}
              </span>
            </button>

            {/* CTA Button */}
            <Link
              href="/products/dau-lac-nguyen-chat"
              className="desktop-cta-btn no-underline"
            >
              Gửi Yêu Cầu Mua
            </Link>

            {/* Menu Trigger */}
            <button
              type="button"
              className="desktop-menu-btn"
              onClick={openNav}
              aria-label="Mở thực đơn"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3. Mobile Sticky Top Navbar ── */}
      <header className="app-navbar" role="banner">
        <Link href="/" className="brand-mark" aria-label="HM NATURALS Trang Chủ">
          <div className="brand-icon" aria-hidden="true">HM</div>
          <div className="brand-text-wrap">
            <span className="brand-text-name">HM NATURALS</span>
            <span className="brand-text-tagline">Dầu Nông Sản Nguyên Bản</span>
          </div>
        </Link>

        {/* Right Action Icons (Strictly 44x44px touch targets) */}
        <div className="nav-actions">
          <Link href="/products" className="nav-touch-btn" aria-label="Tìm kiếm nông phẩm">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </Link>

          <button
            type="button"
            className="nav-touch-btn"
            onClick={openCart}
            aria-label={`Mở giỏ hàng (${totalItems} sản phẩm)`}
          >
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
            {totalItems > 0 && (
              <span className="cart-badge-indicator" aria-hidden="true">{totalItems}</span>
            )}
          </button>

          <button
            type="button"
            className="nav-touch-btn"
            onClick={openNav}
            aria-label="Mở thực đơn điều hướng"
          >
            <svg viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="17" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          </button>
        </div>
      </header>
    </>
  );
}
