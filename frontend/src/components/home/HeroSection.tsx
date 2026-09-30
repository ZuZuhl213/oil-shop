'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UnlabeledBottle, MiniBottleThumb, type UnlabeledBottleOilType } from './UnlabeledBottle';

interface HeroProductInfo {
  type: UnlabeledBottleOilType;
  titleL1: string;
  titleL2: string;
  mobileHeadline: string;
  desc: string;
  slug: string;
}

const HERO_PRODUCTS: Record<UnlabeledBottleOilType, HeroProductInfo> = {
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
    titleL2: 'Rang Mộc',
    mobileHeadline: 'Dầu Mè Đen Rang Mộc',
    desc: 'Hương thơm nồng nàn từ hạt mè đen nương đồi tuyển chọn, ép nhiệt cơ học nguyên chất.',
    slug: 'dau-vung-ep-lanh',
  },
  sachi: {
    type: 'sachi',
    titleL1: 'Dầu Hạt Sachi',
    titleL2: 'Ép Cơ Học',
    mobileHeadline: 'Dầu Hạt Sachi Ép Cơ Học',
    desc: 'Dầu hạt Sachi tự nhiên từ vùng nguyên liệu Tây Nguyên, quy trình mộc chỉn chu.',
    slug: 'dau-sachi-ep-song',
  },
};

export function HeroSection() {
  const [selectedProduct, setSelectedProduct] = useState<UnlabeledBottleOilType>('peanut');
  const [isSpinning, setIsSpinning] = useState(false);
  const [tiltTransform, setTiltTransform] = useState('rotateX(0deg) rotateY(0deg)');

  const current = HERO_PRODUCTS[selectedProduct];

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 1250);
  };

  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSpinning) return;
    const stage = e.currentTarget;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 12;
    const rotateX = -(y / (rect.height / 2)) * 12;
    setTiltTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleStageMouseLeave = () => {
    setTiltTransform('rotateX(0deg) rotateY(0deg)');
  };

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
              <Link href={`/products/${current.slug}`} className="ref-btn-order no-underline">
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

          {/* Right Column: Golden Sunlight Stage + Standalone Bottle + Selector */}
          <div
            className="ref-stage-wrap"
            id="refDesktopStage"
            onMouseMove={handleStageMouseMove}
            onMouseLeave={handleStageMouseLeave}
          >
            {/* Layer 1: Ambient Sunlight Glow */}
            <div className="ref-stage-ambient-glow" aria-hidden="true" />

            {/* Layer 2: Soft Floor Shadow */}
            <div className="ref-stage-floor-shadow" aria-hidden="true" />

            {/* Layer 3: Standalone Unlabeled Clear Glass Bottle (Visual Design Target & Boundary for future Blender GLB) */}
            <div
              className={`unlabeled-bottle-container ${isSpinning ? 'spinning-360' : ''}`}
              id="refBottleWrapper"
              style={{ transform: isSpinning ? undefined : tiltTransform }}
            >
              <UnlabeledBottle type={selectedProduct} />
            </div>

            {/* Layer 4: Subtle Cursive Script Quote */}
            <p className="subtle-script-quote" aria-hidden="true">
              “Món ngon bắt đầu từ nguyên liệu tốt”
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
                className={`ref-thumb-card ${selectedProduct === 'sachi' ? 'active' : ''}`}
                onClick={() => setSelectedProduct('sachi')}
                role="tab"
                aria-selected={selectedProduct === 'sachi'}
                title="Dầu Hạt Sachi Ép Cơ Học"
              >
                <MiniBottleThumb type="sachi" />
                <span className="ref-thumb-label">Dầu Sachi</span>
              </button>

              {/* 360 Degree Rotation Trigger Badge */}
              <button
                type="button"
                className="ref-360-badge"
                onClick={handleSpin}
                aria-label="Xoay 360 độ chai dầu"
                title="Bấm để xoay 360°"
              >
                <div className="ref-360-circle">
                  <span className="ref-360-num">360°</span>
                  <span className="ref-360-icon">↻</span>
                </div>
                <span className="ref-360-text">Kéo để xoay</span>
              </button>
            </div>

            {/* Bottom Drag Indicator — subtle, no false promise */}
            <div className="ref-drag-indicator">
              <span>Di chuyển chuột để nghiêng chai</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile Natural Minimalist Hero (< 1024px) ── */}
      <section className="ref-mobile-hero" id="mobileHeroSection">
        <div className="ref-eyebrow">TINH HOA TỪ NÔNG SẢN VIỆT</div>
        <h1 className="ref-hero-headline" id="mobHeroHeadline">
          {current.mobileHeadline}
        </h1>
        <p className="ref-hero-sub" id="mobHeroDesc">
          {current.desc}
        </p>

        {/* Mobile Visual Stage (Separated Layers) */}
        <div className="ref-stage-wrap">
          <div className="ref-stage-ambient-glow" style={{ width: 260, height: 260 }} />
          <div className="ref-stage-floor-shadow" style={{ width: 200, bottom: 10 }} />
          <div className={`unlabeled-bottle-container ${isSpinning ? 'spinning-360' : ''}`}>
            <UnlabeledBottle type={selectedProduct} />
          </div>
          <p className="subtle-script-quote" style={{ right: 8, bottom: 8, fontSize: 14 }}>
            “Món ngon từ nguyên liệu tốt”
          </p>
        </div>

        {/* Mobile Compact Horizontal Selector */}
        <div className="ref-mobile-selector-row" role="tablist" aria-label="Chọn nông phẩm">
          <button
            type="button"
            className={`ref-mobile-sel-btn ${selectedProduct === 'peanut' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('peanut')}
          >
            <span>Dầu Lạc</span>
          </button>
          <button
            type="button"
            className={`ref-mobile-sel-btn ${selectedProduct === 'sesame' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('sesame')}
          >
            <span>Dầu Mè</span>
          </button>
          <button
            type="button"
            className={`ref-mobile-sel-btn ${selectedProduct === 'sachi' ? 'active' : ''}`}
            onClick={() => setSelectedProduct('sachi')}
          >
            <span>Dầu Sachi</span>
          </button>
          <button
            type="button"
            className="ref-mobile-sel-btn btn-360"
            onClick={handleSpin}
            aria-label="Xoay 360 độ chai dầu"
            title="Xoay 360°"
          >
            <span>↻</span> <span>360°</span>
          </button>
        </div>

        {/* Compact Value Indicators */}
        <div className="ref-hero-indicators" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', margin: '4px 0 8px' }}>
          <span className="ref-indicator-pill">100% Nông sản Việt</span>
          <span className="ref-indicator-pill">Ép nhiệt cơ học</span>
          <span className="ref-indicator-pill">Chai thủy tinh tối màu</span>
        </div>

        {/* Dual CTAs */}
        <div className="ref-ctas-row" style={{ justifyContent: 'center' }}>
          <Link href={`/products/${current.slug}`} className="ref-btn-order no-underline">
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
