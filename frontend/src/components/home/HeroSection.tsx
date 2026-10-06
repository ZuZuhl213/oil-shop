'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { UnlabeledBottle, MiniBottleThumb, type UnlabeledBottleOilType } from './UnlabeledBottle';

export type HeroOilType = 'peanut' | 'sesame' | 'coconut';

interface HeroProductInfo {
  type: HeroOilType;
  titleL1: string;
  titleL2: string;
  mobileHeadline: string;
  desc: string;
  slug: string;
}

const HERO_PRODUCTS: Record<HeroOilType, HeroProductInfo> = {
  peanut: {
    type: 'peanut',
    titleL1: 'Dầu Lạc',
    titleL2: 'Nguyên Chất',
    mobileHeadline: 'Dầu Lạc Nguyên Chất',
    desc: 'Khám phá hương vị đặc trưng của dầu lạc và các sản phẩm dầu thực vật từ nông sản.',
    slug: 'dau-lac-nguyen-chat',
  },
  sesame: {
    type: 'sesame',
    titleL1: 'Dầu Mè Đen',
    titleL2: 'Thơm Đậm',
    mobileHeadline: 'Dầu Mè Đen',
    desc: 'Hương thơm nồng nàn từ hạt mè đen nương đồi tuyển chọn, ép nhiệt cơ học nguyên chất.',
    slug: 'dau-vung-ep-lanh',
  },
  coconut: {
    type: 'coconut',
    titleL1: 'Dầu Dừa',
    titleL2: 'Tinh Khiết',
    mobileHeadline: 'Dầu Dừa',
    desc: 'Cơm dừa tươi ép nhiệt cơ học, thơm dịu ngọt lành, dùng ẩm thực và chăm sóc sức khỏe.',
    slug: 'dau-dua-nguyen-chat',
  },
};

export function HeroSection() {
  const [selectedProduct, setSelectedProduct] = useState<HeroOilType>('peanut');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mobWrapperRef = useRef<HTMLDivElement>(null);

  const current = HERO_PRODUCTS[selectedProduct];

  // Reusable gentle sway wobble trigger (Lắc nhẹ tự nhiên khi tương tác hoặc đổi loại dầu)
  const triggerGentleSway = useCallback((el: HTMLElement | null) => {
    if (!el || typeof window === 'undefined') return;
    const gsap = (window as any).gsap;
    if (!gsap) return;
    gsap.killTweensOf(el);
    const tl = gsap.timeline();
    tl.to(el, { rotation: -2.8, duration: 0.16, ease: 'power1.out', transformOrigin: '50% 88%' })
      .to(el, { rotation: 2.0, duration: 0.2, ease: 'power1.inOut' })
      .to(el, { rotation: -0.8, duration: 0.16, ease: 'power1.inOut' })
      .to(el, { rotation: 0, duration: 0.22, ease: 'power2.out' });
  }, []);

  // Soft settle sway whenever selected oil variant changes
  useEffect(() => {
    triggerGentleSway(wrapperRef.current);
    triggerGentleSway(mobWrapperRef.current);
  }, [selectedProduct, triggerGentleSway]);

  const scrollToDiscovery = (e: React.MouseEvent) => {
    const el = document.getElementById('desktopProductDiscovery');
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* ── Desktop Minimalist Golden-Sunlight Hero (>= 1024px) ── */}
      <section className="ref-desktop-hero" id="desktopHeroSection">
        <div className="ref-hero-wrap">
          {/* Left Column: Brand Story & CTAs */}
          <div className="ref-hero-left">
            <div className="ref-eyebrow">
              <span>TINH HOA TỪ NÔNG SẢN VIỆT</span>
            </div>

            <h1 className="ref-hero-title" id="refHeroHeadline">
              <span>{current.titleL1}</span>
              <span>{current.titleL2}</span>
            </h1>

            <p className="ref-hero-desc">
              {current.desc}
            </p>

            {/* Compact Value Indicators (Free of Unverified Medical Claims) */}
            <div className="ref-hero-indicators">
              <span className="ref-indicator-pill">100% Nông sản Việt</span>
              <span className="ref-indicator-pill">Ép nhiệt cơ học</span>
              <span className="ref-indicator-pill">Chai thủy tinh tối màu</span>
            </div>

            {/* Dual Action Buttons */}
            <div className="ref-ctas-row">
              <Link href="/products" className="ref-btn-order no-underline">
                <span>Đặt hàng ngay</span>
                <span>→</span>
              </Link>
              <a
                href="#desktopProductDiscovery"
                onClick={scrollToDiscovery}
                className="ref-btn-explore no-underline"
              >
                <span>Khám phá sản phẩm</span>
              </a>
            </div>

            {/* Bottom Scroll Prompt */}
            <div className="ref-scroll-prompt">
              <span className="ref-scroll-arrow">↓</span>
              <span>SCROLL ĐỂ KHÁM PHÁ</span>
            </div>
          </div>

          {/* Right Column: Golden Sunlight Stage + Product Image + Selector */}
          <div
            className="ref-stage-wrap"
            id="refDesktopStage"
          >
            {/* Layer 1: Ambient Sunlight Glow */}
            <div className="ref-stage-ambient-glow" aria-hidden="true" />

            {/* Layer 2: Soft Floor Shadow */}
            <div className="ref-stage-floor-shadow" aria-hidden="true" />

            {/* Layer 3: Standalone Unlabeled Clear Glass Bottle */}
            <div
              className="unlabeled-bottle-container"
              id="refBottleWrapper"
              ref={wrapperRef}
            >
              <div className="bottle-sway-inner bottle-gentle-sway">
                <UnlabeledBottle type={selectedProduct} idPrefix="desk" />
              </div>
            </div>

            {/* Layer 4: Subtle Cursive Script Quote */}
            <p className="subtle-script-quote" aria-hidden="true">
              &ldquo;Món ngon bắt đầu từ nguyên liệu tốt&rdquo;
            </p>

            {/* Layer 5: Compact Right-Side Product Selector Dock */}
            <div className="ref-thumbs-dock" role="tablist" aria-label="Chọn sản phẩm trưng bày">
              <button
                type="button"
                className={`ref-thumb-card ${selectedProduct === 'peanut' ? 'active' : ''}`}
                onClick={() => setSelectedProduct('peanut')}
                role="tab"
                aria-selected={selectedProduct === 'peanut'}
                title="Dầu Lạc Nguyên Chất"
              >
                <MiniBottleThumb type="peanut" />
                <span className="ref-thumb-label">Dầu Lạc</span>
              </button>

              <button
                type="button"
                className={`ref-thumb-card ${selectedProduct === 'sesame' ? 'active' : ''}`}
                onClick={() => setSelectedProduct('sesame')}
                role="tab"
                aria-selected={selectedProduct === 'sesame'}
                title="Dầu Mè Đen Rang Mộc"
              >
                <MiniBottleThumb type="sesame" />
                <span className="ref-thumb-label">Dầu Mè</span>
              </button>

              <button
                type="button"
                className={`ref-thumb-card ${selectedProduct === 'coconut' ? 'active' : ''}`}
                onClick={() => setSelectedProduct('coconut')}
                role="tab"
                aria-selected={selectedProduct === 'coconut'}
                title="Dầu Dừa Ép Lạnh Tinh Khiết"
              >
                <MiniBottleThumb type="coconut" />
                <span className="ref-thumb-label">Dầu Dừa</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile Natural Minimalist Hero (< 1024px) ── */}
      <section className="ref-mobile-hero" id="mobileHeroSection">
        <div className="ref-mobile-hero-header">
          <div className="ref-eyebrow">
            <span>TINH HOA TỪ NÔNG SẢN VIỆT</span>
          </div>
          <h1 className="ref-hero-headline" id="mobHeroHeadline">
            {current.mobileHeadline}
          </h1>
          <p className="ref-hero-sub" id="mobHeroDesc">
            {current.desc}
          </p>
        </div>

        {/* Mobile Visual Stage (Separated Layers) */}
        <div className="ref-stage-wrap">
          <div className="ref-stage-ambient-glow" aria-hidden="true" />
          <div className="ref-stage-floor-shadow" aria-hidden="true" />
          <div
            className="unlabeled-bottle-container"
            id="refMobileBottleWrapper"
            ref={mobWrapperRef}
          >
            <div className="bottle-sway-inner bottle-gentle-sway">
              <UnlabeledBottle type={selectedProduct} idPrefix="mob" />
            </div>
          </div>
        </div>

        {/* Brand Quote — centered outside the stage */}
        <p className="ref-mobile-hero-quote" aria-hidden="true">
          &ldquo;Món ngon từ nguyên liệu tốt&rdquo;
        </p>

        {/* Mobile Compact Horizontal Selector */}
        <div className="ref-mobile-selector-row" role="tablist" aria-label="Chọn nông phẩm">
          <button
            type="button"
            role="tab"
            aria-selected={selectedProduct === 'peanut'}
            className={`ref-mobile-sel-btn ${selectedProduct === 'peanut' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('peanut')}
          >
            <span>Dầu Lạc</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedProduct === 'sesame'}
            className={`ref-mobile-sel-btn ${selectedProduct === 'sesame' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('sesame')}
          >
            <span>Dầu Mè</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedProduct === 'coconut'}
            className={`ref-mobile-sel-btn ${selectedProduct === 'coconut' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('coconut')}
          >
            <span>Dầu Dừa</span>
          </button>
        </div>

        {/* Compact Value Indicators */}
        <div className="ref-hero-indicators">
          <span className="ref-indicator-pill">100% Nông sản Việt</span>
          <span className="ref-indicator-pill">Ép nhiệt cơ học</span>
          <span className="ref-indicator-pill">Chai thủy tinh tối màu</span>
        </div>

        {/* Dual CTAs */}
        <div className="ref-ctas-row">
          <Link href="/products" className="ref-btn-order no-underline">
            <span>Đặt hàng ngay</span>
            <span>→</span>
          </Link>
          <a
            href="#desktopProductDiscovery"
            onClick={scrollToDiscovery}
            className="ref-btn-explore no-underline"
          >
            <span>Khám phá sản phẩm</span>
          </a>
        </div>
      </section>
    </>
  );
}
