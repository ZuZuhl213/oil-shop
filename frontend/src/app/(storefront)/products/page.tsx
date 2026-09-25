'use client';

import React, { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockProducts } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>(initialQuery);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setKeyword(q);
    }
  }, [searchParams]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    let result = mockProducts.filter((p) => p.status === 'ACTIVE');

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'peanut') result = result.filter((p) => p.visualType === 'peanut');
      else if (selectedCategory === 'sesame') result = result.filter((p) => p.visualType === 'sesame');
      else if (selectedCategory === 'sachi') result = result.filter((p) => p.visualType === 'sachi');
      else if (selectedCategory === 'byproduct') result = result.filter((p) => p.visualType === 'byproduct');
    }

    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.shortDescription?.toLowerCase().includes(kw) ||
          p.description?.toLowerCase().includes(kw),
      );
    }

    return result;
  }, [selectedCategory, keyword]);

  const handleReset = () => {
    setSelectedCategory('all');
    setKeyword('');
  };

  return (
    <div className="site-container py-4 pb-16">
      {/* Header with Title and Counter */}
      <div className="home-section-head" style={{ paddingTop: 14 }}>
        <div>
          <span className="section-eyebrow">Cửa hàng trực tuyến</span>
          <h2 className="section-title">Danh Mục Đầy Đủ</h2>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filteredProducts.length} sản phẩm
        </span>
      </div>

      {/* Search Bar with Live Debounced Filter */}
      <div className="listing-search-row">
        <div className="search-field-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên dầu, mè, đậu phộng..."
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
      </div>

      {/* Category Rail Chips */}
      <div className="category-chip-rail">
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Tất Cả
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

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="product-grid-2col">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty Search Alert */
        <div className="empty-search-alert" style={{ display: 'block' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'var(--forest-green)',
              marginBottom: 4,
            }}
          >
            Không tìm thấy nông phẩm phù hợp
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Vui lòng thử lại với từ khóa khác hoặc chọn xem lại tất cả sản phẩm.
          </p>
          <button
            type="button"
            className="btn-action-touch fixed-flow"
            onClick={handleReset}
          >
            Xem Lại Tất Cả
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-text-muted">Đang tải danh mục nông sản...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
