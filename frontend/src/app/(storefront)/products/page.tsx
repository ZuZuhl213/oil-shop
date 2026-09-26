'use client';

/* eslint-disable react-hooks/set-state-in-effect -- browser hydration/API synchronization */

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { mockProducts } from '@/lib/mock-data';
import type { ExtendedProductDto } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { getCategories, getProducts } from '@/lib/api/client';
import { toUiProducts } from '@/lib/catalog-adapter';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'all',
  );
  const [keyword, setKeyword] = useState<string>(searchParams.get('q') || '');
  const [catalogProducts, setCatalogProducts] = useState<ExtendedProductDto[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    if (q !== null) setKeyword(q);
    if (category !== null) setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const sequence = ++requestSequence.current;
    setIsLoading(true);
    Promise.all([
      getCategories(),
      getProducts({ page: 0, size: 100, keyword: keyword.trim() || undefined }),
    ])
      .then(([categories, page]) => {
        if (!active || sequence !== requestSequence.current) return;
        setCatalogProducts(toUiProducts(page.content, categories));
        setLoadError(null);
      })
      .catch(() => {
        if (!active || sequence !== requestSequence.current) return;
        setCatalogProducts(mockProducts);
        setLoadError('Không kết nối được dữ liệu mới; đang hiển thị danh mục gần nhất.');
      })
      .finally(() => {
        if (active && sequence === requestSequence.current) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [keyword]);

  const filteredProducts = useMemo(() => {
    let result = catalogProducts.filter((product) => product.status === 'ACTIVE');

    if (selectedCategory !== 'all') {
      const visualCategory = new Set(['peanut', 'sesame', 'sachi', 'byproduct', 'gac', 'coconut', 'seeds']);
      result = visualCategory.has(selectedCategory)
        ? result.filter((product) => product.visualType === selectedCategory)
        : result.filter((product) => product.categorySlug === selectedCategory || product.categoryId === selectedCategory);
    }

    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(kw) ||
          product.shortDescription?.toLowerCase().includes(kw) ||
          product.description?.toLowerCase().includes(kw),
      );
    }

    return result;
  }, [catalogProducts, selectedCategory, keyword]);

  const handleReset = () => {
    setSelectedCategory('all');
    setKeyword('');
  };

  return (
    <div className="site-container py-4 pb-16">
      <div className="home-section-head" style={{ paddingTop: 14 }}>
        <div>
          <span className="section-eyebrow">Cửa hàng trực tuyến</span>
          <h2 className="section-title">Danh Mục Đầy Đủ</h2>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {isLoading ? 'Đang tải…' : String(filteredProducts.length) + ' sản phẩm'}
        </span>
      </div>

      <div className="listing-search-row">
        <div className="search-field-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên dầu, mè, đậu phộng..."
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
      </div>

      <div className="category-chip-rail">
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'all' ? 'active' : '')}
          onClick={() => setSelectedCategory('all')}
        >
          Tất Cả
        </button>
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'peanut' ? 'active' : '')}
          onClick={() => setSelectedCategory('peanut')}
        >
          Dầu Đậu Phộng
        </button>
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'sesame' ? 'active' : '')}
          onClick={() => setSelectedCategory('sesame')}
        >
          Dầu Mè
        </button>
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'sachi' ? 'active' : '')}
          onClick={() => setSelectedCategory('sachi')}
        >
          Dầu Hạt Sachi
        </button>
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'byproduct' ? 'active' : '')}
          onClick={() => setSelectedCategory('byproduct')}
        >
          Phụ Phẩm Sạch
        </button>
      </div>

      {loadError && (
        <p role="status" style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
          {loadError}
        </p>
      )}

      {filteredProducts.length > 0 ? (
        <div className="product-grid-2col">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
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
          <button type="button" className="btn-action-touch fixed-flow" onClick={handleReset}>
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
