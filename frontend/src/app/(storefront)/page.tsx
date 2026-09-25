'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  mockProducts,
  mockCategories,
  mockKnowledgeArticles,
  ExtendedProductDto,
} from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { formatCurrencyVnd } from '@/lib/format/currency';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [bottleTransform, setBottleTransform] = useState<string>('rotateX(0deg) rotateY(0deg)');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Hero carousel products
  const heroSlideProducts = mockProducts.filter((p) => p.featured || p.id === '1' || p.id === '2' || p.id === '3');

  // Filter products by category
  const filteredProducts = mockProducts.filter((product) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'peanut') return product.visualType === 'peanut';
    if (selectedCategory === 'sesame') return product.visualType === 'sesame';
    if (selectedCategory === 'sachi') return product.visualType === 'sachi';
    if (selectedCategory === 'byproduct') return product.visualType === 'byproduct';
    return true;
  });

  const featuredArticles = mockKnowledgeArticles.slice(0, 3);

  // Interactive 3D Bottle mouse move handler for Desktop
  const handleBottleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const stage = e.currentTarget;
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 14;
    const rotateX = -(y / (rect.height / 2)) * 14;
    setBottleTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleBottleStageMouseLeave = () => {
    setBottleTransform('rotateX(0deg) rotateY(0deg)');
  };

  // Mobile carousel scroll tracker
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = 320; // 308px + 12px gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveSlideIndex(index);
  };

  const scrollCarouselTo = (index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = 320;
    carouselRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    setActiveSlideIndex(index);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ========================================================
          1. DESKTOP 1440px / 1024px HERO & 3D STAGE (>= lg)
          ======================================================== */}
      <section className="hidden lg:block">
        <div className="desktop-hero-wrap" id="desktopHeroSection">
          {/* Left Column: Editorial Brand Story & Primary Actions */}
          <div className="desktop-hero-content">
            <div className="desktop-eyebrow">
              <span style={{ color: 'var(--peanut-gold)', fontSize: 16 }}>🌿</span>
              <span>DẦU THỰC VẬT ÉP CƠ HỌC BẢN ĐỊA</span>
            </div>

            <h1 className="desktop-hero-title">
              Vẹn Nguyên Giọt Dầu Thuần Khiết Từ Đất Mẹ
            </h1>

            <p className="desktop-hero-desc">
              Dầu ăn ép cơ học nguyên bản từ nguồn đậu phộng sẻ và mè đen bản địa. Không tinh luyện hóa chất, giữ trọn sắc sánh và hương vị mộc mạc cho gian bếp gia đình.
            </p>

            <div className="desktop-hero-ctas">
              <Link href="/products" className="btn-hero-primary no-underline">
                <span>Khám Phá Tuyển Phẩm</span>
                <span>→</span>
              </Link>
              <Link href="/products/dau-sachi-ep-song" className="btn-hero-secondary no-underline">
                <span>Yêu Cầu Báo Giá Sỉ</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Dedicated Interactive 3D Bottle Stage */}
          <div
            className="desktop-3d-stage"
            id="desktopBottleStage"
            onMouseMove={handleBottleStageMouseMove}
            onMouseLeave={handleBottleStageMouseLeave}
          >
            {/* Interactive 3D Bottle Simulator */}
            <div
              className="desktop-bottle-wrapper"
              id="desktopBottleWrapper"
              style={{ transform: bottleTransform }}
            >
              <svg className="desktop-bottle-svg" viewBox="180 50 240 370" xmlns="http://www.w3.org/2000/svg">
                <radialGradient id="deskG" cx="50%" cy="45%" r="60%">
                  <stop offset="0%" stopColor="#FFE8C2" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#E8CEB0" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F2EADF" stopOpacity="0" />
                </radialGradient>
                <ellipse cx="300" cy="400" rx="90" ry="16" fill="#3D3024" opacity="0.25" />
                {/* Amber Glass Bottle Body */}
                <path d="M245 105 h110 v35 l30 55 v180 c0 16 -12 28 -28 28 h-114 c-16 0 -28 -12 -28 -28 v-180 l30 -55 z" fill="#8C4E15" />
                <path d="M252 195 h96 v170 c0 12 -10 22 -22 22 h-52 c-12 0 -22 -10 -22 -22 z" fill="#D98A2B" opacity="0.95" />
                {/* Glass Optical Reflections */}
                <path d="M256 198 v165" stroke="#FFFFFF" strokeWidth="6" opacity="0.45" strokeLinecap="round" />
                <path d="M344 205 v158" stroke="#FFE7BA" strokeWidth="3.5" opacity="0.4" strokeLinecap="round" />
                {/* Wooden Stopper */}
                <rect x="268" y="65" width="64" height="42" rx="5" fill="#422915" />
                <rect x="272" y="70" width="56" height="8" rx="2" fill="#C88B3A" opacity="0.85" />
                {/* Artisanal Typographic Label */}
                <rect x="256" y="220" width="88" height="135" rx="4" fill="#FAF6EE" stroke="#D9CDBF" />
                <text x="300" y="246" fontFamily="'Playfair Display', serif" fontSize="10.5" fontWeight="bold" fill="#26402F" textAnchor="middle" letterSpacing="1">HM NATURALS</text>
                <line x1="268" y1="254" x2="332" y2="254" stroke="#C88B3A" strokeWidth="1.2" />
                <circle cx="300" cy="278" r="14" fill="#F0E5D4" stroke="#7A4B13" strokeWidth="1" />
                <text x="300" y="283" fontFamily="sans-serif" fontSize="12" textAnchor="middle">🥜</text>
                <text x="300" y="310" fontFamily="'Playfair Display', serif" fontSize="9" fontWeight="bold" fill="#221A14" textAnchor="middle">DẦU ĐẬU PHỘNG</text>
                <text x="300" y="324" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="7" fontWeight="600" fill="#474E2B" textAnchor="middle" letterSpacing="1">ÉP CƠ HỌC MỘC</text>
                <text x="300" y="340" fontFamily="'Be Vietnam Pro', sans-serif" fontSize="7" fill="#7A4B13" textAnchor="middle">500ml • Chai Thủy Tinh</text>
              </svg>
            </div>

            {/* Subtle Floating Pill: Product Volume & Packaging */}
            <div className="stage-badge-volume">
              500ml • Chai Thủy Tinh Hổ Phách
            </div>
          </div>
        </div>

        {/* Dedicated 3 Supporting Feature Blocks Section Below Hero */}
        <section className="desktop-trust-section" id="desktopHeroPillars" aria-label="Cam kết chất lượng nông sản">
          <div className="desktop-trust-grid">
            <div className="pillar-card">
              <div className="pillar-icon">🌱</div>
              <div className="pillar-content">
                <strong>Nông Sản Thuần Bản Địa</strong>
                <span>Đậu phộng sẻ và mè đen thuần nông tuyển chọn từ nông hộ Việt Nam, hạt chắc mẩy giàu dinh dưỡng.</span>
              </div>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">⚙️</div>
              <div className="pillar-content">
                <strong>Ép Cơ Học Mộc</strong>
                <span>Quy trình ép chậm vật lý không qua tinh luyện hóa chất, giữ vẹn nguyên sắc sánh và mùi thơm tự nhiên.</span>
              </div>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">🏺</div>
              <div className="pillar-content">
                <strong>Thủy Tinh Tối Màu</strong>
                <span>Lắng lọc tự nhiên qua vải dâu mộc, đóng chai thủy tinh hổ phách chắn sáng giúp bảo quản bền lâu.</span>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* ========================================================
          2. MOBILE HERO CAROUSEL (< lg)
          ======================================================== */}
      <section className="lg:hidden hero-carousel-section">
        <div className="carousel-peeking-info">
          <span className="section-eyebrow">Tuyển phẩm vụ mùa</span>
        </div>

        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="carousel-track"
          role="region"
          aria-label="Băng chuyền sản phẩm nổi bật"
        >
          {heroSlideProducts.map((prod) => {
            const isQuote = prod.saleType === 'QUOTE';
            const defaultVar = prod.variants[0];
            return (
              <div key={prod.id} className="hero-slide-card">
                <Link href={`/products/${prod.slug}`} className="hero-slide-media no-underline">
                  <ProductBottleImage type={prod.visualType} alt={prod.name} />
                  <span className="photo-illustrate-tag">Ảnh mẫu minh họa</span>
                </Link>

                <div className="hero-slide-info">
                  <div>
                    <span className="slide-cat-label">
                      {prod.visualType === 'peanut' ? 'Dầu Đậu Phộng Tự Nhiên' : prod.visualType === 'sesame' ? 'Dầu Mè Đen Thủ Công' : 'Dầu Hạt Dưỡng Sinh'}
                    </span>
                    <h3 className="slide-prod-title">
                      <Link href={`/products/${prod.slug}`} className="text-inherit no-underline">
                        {prod.name}
                      </Link>
                    </h3>
                    <p className="slide-prod-desc">{prod.shortDescription}</p>
                  </div>

                  <div className="slide-bottom-row">
                    {isQuote ? (
                      <span className="slide-quote-label">Yêu cầu báo giá</span>
                    ) : (
                      <span className="slide-price-figure">
                        {defaultVar?.price ? formatCurrencyVnd(defaultVar.price) : 'Liên hệ'}
                      </span>
                    )}

                    <Link
                      href={`/products/${prod.slug}`}
                      className={`btn-action-touch ${isQuote ? 'quote-flow' : 'fixed-flow'} no-underline`}
                    >
                      {isQuote ? 'Báo Giá Sỉ' : 'Xem Quy Cách →'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Dots */}
        <div className="carousel-dots-row" role="tablist" aria-label="Chỉ số vị trí băng chuyền">
          {heroSlideProducts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`dot-indicator ${activeSlideIndex === idx ? 'active' : ''}`}
              onClick={() => scrollCarouselTo(idx)}
              aria-label={`Trang ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================
          3. CATEGORY RAIL & PRODUCT GRID
          ======================================================== */}
      <section className="site-container">
        <div className="home-section-head">
          <div>
            <span className="section-eyebrow">Hệ sản phẩm mộc</span>
            <h2 className="section-title">Danh Mục Nông Sản</h2>
          </div>
          <Link href="/products" className="section-more-link">
            Xem tất cả →
          </Link>
        </div>

        {/* Category Chips Rail */}
        <div className="category-chip-rail">
          <button
            type="button"
            className={`cat-chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tất Cả ({mockProducts.length})
          </button>
          <button
            type="button"
            className={`cat-chip-btn ${selectedCategory === 'peanut' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('peanut')}
          >
            Dầu Đậu Phộng
          </button>
          <button
            type="button"
            className={`cat-chip-btn ${selectedCategory === 'sesame' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('sesame')}
          >
            Dầu Mè
          </button>
          <button
            type="button"
            className={`cat-chip-btn ${selectedCategory === 'sachi' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('sachi')}
          >
            Dầu Hạt Sachi
          </button>
          <button
            type="button"
            className={`cat-chip-btn ${selectedCategory === 'byproduct' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('byproduct')}
          >
            Phụ Phẩm Sạch
          </button>
        </div>

        {/* 2-Col Mobile / 4-Col Desktop Grid */}
        <div className="product-grid-2col">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ========================================================
          4. PRODUCTION PROCESS (3 PRINCIPLES OF HM NATURALS)
          ======================================================== */}
      <section className="site-container">
        <div className="process-strip-card">
          <span className="section-eyebrow">Quy trình trung thực</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest-green)', marginTop: 2 }}>
            Ba Nguyên Tắc Ép Dầu Tự Nhiên HM NATURALS
          </h3>
          <div className="process-steps-list">
            <div className="process-step-item">
              <div className="step-badge">1</div>
              <div className="step-text">
                <h4>Ép cơ học chậm, không tinh luyện</h4>
                <p>Bảo toàn dinh dưỡng chất béo tự nhiên, không gia nhiệt cao, không qua xử lý hóa chất.</p>
              </div>
            </div>
            <div className="process-step-item">
              <div className="step-badge">2</div>
              <div className="step-text">
                <h4>Lắng lọc tự nhiên qua vải mộc</h4>
                <p>Không dùng phụ gia tẩy trong hay khử mùi, giữ nguyên độ sánh và hương thơm mộc của hạt.</p>
              </div>
            </div>
            <div className="process-step-item">
              <div className="step-badge">3</div>
              <div className="step-text">
                <h4>Bảo quản chai thủy tinh tối màu</h4>
                <p>Hạn chế tác động của ánh sáng, giúp duy trì chất lượng và độ tươi của dầu sau khi ép.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. BRAND STORY BANNER
          ======================================================== */}
      <section className="site-container">
        <div className="story-banner">
          <h3>Gìn Giữ Hạt Nông Sản Thuần Bản Địa</h3>
          <p>
            Mỗi giọt dầu HM NATURALS được làm từ nguồn nông sản chọn lọc, thu mua trung thực từ nông hộ bản địa, giữ trọn vẹn sự tinh khiết và dinh dưỡng lành mạnh.
          </p>
          <a
            href="tel:0912345678"
            className="btn-action-touch quote-flow no-underline inline-flex"
            style={{ background: '#FFF' }}
          >
            Liên Hệ Xưởng Ép: 0912 345 678
          </a>
        </div>
      </section>

      {/* ========================================================
          6. KNOWLEDGE HUB SECTION (Góc Kiến Thức — Task 1)
          ======================================================== */}
      <section className="site-container">
        <div className="home-section-head">
          <div>
            <span className="section-eyebrow">Cẩm nang &amp; Kinh nghiệm</span>
            <h2 className="section-title">Góc Kiến Thức</h2>
          </div>
          <Link href="/knowledge" className="section-more-link">
            Xem tất cả →
          </Link>
        </div>

        <div className="knowledge-featured-list">
          {featuredArticles.map((art) => (
            <Link
              key={art.id}
              href={`/knowledge/${art.slug}`}
              className="knowledge-card"
            >
              <div className="knowledge-card-media">
                <ProductBottleImage type={art.thumbnailType ?? 'peanut'} alt={art.title} />
                <span className="knowledge-cat-badge">{art.categoryName}</span>
              </div>
              <div className="knowledge-card-body">
                <h4 className="knowledge-card-title">{art.title}</h4>
                <p className="knowledge-card-excerpt">{art.excerpt}</p>

                <div className="article-takeaway-box" style={{ margin: '8px 0 0', padding: '10px 12px' }}>
                  <div className="article-takeaway-title">💡 Điểm cốt lõi</div>
                  <div className="article-takeaway-text" style={{ fontSize: 12.5 }}>
                    {art.takeaway}
                  </div>
                </div>

                <div className="knowledge-card-meta">
                  <span>⏱ {art.readTime}</span>
                  <span>Đọc tiếp →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
