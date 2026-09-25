'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockKnowledgeArticles } from '@/lib/mock-data';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';

export default function KnowledgePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');

  const filteredArticles = mockKnowledgeArticles.filter((article) => {
    if (selectedCategory !== 'all' && article.categoryKey !== selectedCategory) {
      return false;
    }
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      return (
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.takeaway.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="site-container py-4 pb-20">
      {/* Header */}
      <div className="knowledge-listing-head">
        <span className="section-eyebrow">Cẩm nang ẩm thực &amp; mẹo vặt</span>
        <h2 className="section-title">Góc Kiến Thức</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
          Kinh nghiệm chọn dầu, mẹo nấu nướng thực tế và cách bảo quản nguyên bản.
        </p>
      </div>

      {/* Search Bar */}
      <div className="knowledge-search-bar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="knowledge-search-input"
          placeholder="Tìm bài viết, mẹo vặt, điểm khói..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* Category Filter Chips */}
      <div className="category-chip-rail" id="knowledgeCategoryRail">
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Tất Cả ({mockKnowledgeArticles.length})
        </button>
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'oil-knowledge' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('oil-knowledge')}
        >
          Kiến Thức Dầu
        </button>
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'kitchen-tips' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('kitchen-tips')}
        >
          Mẹo Nhà Bếp
        </button>
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'storage' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('storage')}
        >
          Bảo Quản
        </button>
        <button
          type="button"
          className={`cat-chip-btn ${selectedCategory === 'recipes' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('recipes')}
        >
          Công Thức Món
        </button>
      </div>

      {/* Articles Grid / List Container */}
      {filteredArticles.length > 0 ? (
        <div className="knowledge-featured-list" style={{ marginTop: 14 }}>
          {filteredArticles.map((art) => (
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
      ) : (
        /* Empty State */
        <div className="empty-search-alert" style={{ display: 'block', margin: '16px var(--screen-pad)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--forest-green)', marginBottom: 4 }}>
            Không Tìm Thấy Bài Viết
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Vui lòng thử từ khóa khác hoặc bấm nút bên dưới để xem lại tất cả bài viết.
          </p>
          <button
            type="button"
            className="btn-action-touch quote-flow"
            style={{ marginTop: 12 }}
            onClick={() => {
              setSelectedCategory('all');
              setKeyword('');
            }}
          >
            Xem Lại Tất Cả
          </button>
        </div>
      )}
    </div>
  );
}
