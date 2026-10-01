'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CategoryDto, PageDto, ProductDto } from '@/lib/api/contracts/types';
import type { ExtendedProductDto } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { toUiProducts } from '@/lib/catalog-adapter';

function ProductsContent() {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';
  const keyword = searchParams.get('q') || '';
  const [keywordInput, setKeywordInput] = useState(keyword);
  const requestedPage = Number(searchParams.get('page') || 0);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([selectedCategory, keyword.trim(), currentPage, retry]);
  const [result, setResult] = useState<{
    key: string; products: ExtendedProductDto[]; categories: CategoryDto[];
    page?: PageDto<ProductDto>; error?: string;
  } | null>(null);
  const current = result?.key === requestKey ? result : null;
  const isLoading = !current;
  const loadError = current?.error;
  const filteredProducts = current?.products ?? [];

  const updateQuery = (changes: { category?: string; q?: string; page?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (changes.category !== undefined) {
      if (changes.category === 'all') params.delete('category');
      else params.set('category', changes.category);
    }
    if (changes.q !== undefined) {
      setKeywordInput(changes.q);
      if (changes.q) params.set('q', changes.q);
      else params.delete('q');
    } else if (keywordInput) {
      params.set('q', keywordInput);
    } else {
      params.delete('q');
    }
    params.set('page', String(changes.page ?? 0));
    // These filters load through the client API; native history avoids racing RSC navigations.
    window.history.replaceState(null, '', '/products?' + params.toString());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect external URL/back navigation
    setKeywordInput(keyword);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getCategories(),
      getProducts({ page: currentPage, size: 12, category: selectedCategory === 'all' ? undefined : selectedCategory, keyword: keyword.trim() || undefined }),
    ])
      .then(([categories, page]) => {
        if (!active) return;
        if (selectedCategory !== 'all' && !categories.some((category) => category.slug === selectedCategory && category.isActive)) {
          setResult({ key: requestKey, products: [], categories, error: 'Không tìm thấy danh mục này.' });
          return;
        }
        setResult({ key: requestKey, products: toUiProducts(page.content, categories), categories, page });
      })
      .catch(() => {
        if (!active) return;
        setResult({ key: requestKey, products: [], categories: [], error: 'Không tải được danh mục. Vui lòng thử lại.' });
      });
    return () => {
      active = false;
    };
  }, [requestKey, currentPage, selectedCategory, keyword]);

  const handleReset = () => {
    updateQuery({ category: 'all', q: '', page: 0 });
  };

  return (
    <div className="site-container py-4 pb-16">
      <div className="home-section-head" style={{ paddingTop: 14 }}>
        <div>
          <span className="section-eyebrow">Cửa hàng trực tuyến</span>
          <h2 className="section-title">Danh Mục Đầy Đủ</h2>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {isLoading ? 'Đang tải…' : String(current?.page?.totalElements ?? 0) + ' sản phẩm'}
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
            value={keywordInput}
            onChange={(event) => {
              updateQuery({ q: event.target.value });
            }}
            placeholder="Tìm theo tên dầu, mè, đậu phộng..."
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
      </div>

      <div className="category-chip-rail">
        <button
          type="button"
          className={'cat-chip-btn ' + (selectedCategory === 'all' ? 'active' : '')}
          aria-pressed={selectedCategory === 'all'}
          onClick={() => updateQuery({ category: 'all' })}
        >
          Tất Cả
        </button>
        {(current?.categories ?? result?.categories ?? []).map((category) => (
          <button key={category.id} type="button"
            aria-pressed={selectedCategory === category.slug}
            className={'cat-chip-btn ' + (selectedCategory === category.slug ? 'active' : '')}
            onClick={() => updateQuery({ category: category.slug })}>
            {category.name}
          </button>
        ))}
      </div>

      {loadError && (
        <div role="alert" style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
          <p>{loadError}</p>
          <button type="button" className="btn-action-touch fixed-flow" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="product-grid-2col">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : !isLoading && !loadError ? (
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
      ) : isLoading ? <p role="status">Đang tải sản phẩm…</p> : null}
      {!!current?.page && current.page.totalPages > 1 && (
        <nav aria-label="Phân trang sản phẩm" className="flex items-center justify-center gap-4 mt-6">
          <button type="button" className="cat-chip-btn" disabled={currentPage === 0} onClick={() => updateQuery({ page: currentPage - 1 })}>Trang trước</button>
          <span>Trang {currentPage + 1} / {current.page.totalPages}</span>
          <button type="button" className="cat-chip-btn" disabled={currentPage + 1 >= current.page.totalPages} onClick={() => updateQuery({ page: currentPage + 1 })}>Trang sau</button>
        </nav>
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
