'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExtendedProductDto } from '@/lib/mock-data';
import { ProductCard } from '@/components/product/ProductCard';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { toUiProducts } from '@/lib/catalog-adapter';
import type { CategoryDto } from '@/lib/api/contracts/types';
import { HeroSection } from '@/components/home/HeroSection';
import { CompactValuesSection } from '@/components/home/CompactValuesSection';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalogProducts, setCatalogProducts] = useState<ExtendedProductDto[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryDto[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const requestKey = selectedCategory + ':' + retry;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const catalogLoading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    Promise.all([
      getCategories(),
      getProducts({
        page: 0,
        size: 12,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      }),
    ])
      .then(([categories, page]) => {
        if (active) {
          setCatalogProducts(toUiProducts(page.content, categories));
          setCatalogCategories(categories);
          setCatalogError(null);
          setLoadedKey(requestKey);
        }
      })
      .catch(() => {
        if (active) {
          setCatalogProducts([]);
          setCatalogError('Không tải được sản phẩm. Vui lòng thử lại.');
          setLoadedKey(requestKey);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedCategory, requestKey]);

  // Filter products by category
  const filteredProducts = catalogLoading ? [] : catalogProducts;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── Section A: Minimalist Warm-Sunlight Hero ── */}
      <HeroSection />

      {/* ── Section B: Three Compact Value Blocks ── */}
      <CompactValuesSection />

      {/* ── Section C: Product Discovery ── */}
      <section
        className="site-container desktop-discovery-section"
        id="desktopProductDiscovery"
        aria-label="Khám phá sản phẩm"
      >
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
            Tất Cả ({catalogProducts.length})
          </button>
          {catalogCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`cat-chip-btn ${selectedCategory === category.slug ? 'active' : ''}`}
              aria-pressed={selectedCategory === category.slug}
              onClick={() => setSelectedCategory(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Status, Error & 2-Col Mobile / 4-Col Desktop Grid */}
        {catalogLoading && <p role="status">Đang tải sản phẩm…</p>}
        {!catalogLoading && !catalogError && filteredProducts.length === 0 && (
          <p role="status">Chưa có sản phẩm trong danh mục này.</p>
        )}
        {!catalogLoading && catalogError && (
          <div role="alert" className="mb-4">
            <p>{catalogError}</p>
            <button
              type="button"
              className="btn-action-touch fixed-flow"
              onClick={() => setRetry((value) => value + 1)}
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="product-grid-2col" id="desktopProductGridContainer">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
