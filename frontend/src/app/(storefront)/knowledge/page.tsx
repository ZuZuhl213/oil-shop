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
        <span className="section-eyebrow">Cẩm nang ẩm thực &amp; cơ sở khoa học</span>
        <h2 className="section-title">Góc Kiến Thức</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
          Tổng hợp kiến thức dinh dưỡng, cơ sở khoa học từ WHO, Harvard và kinh nghiệm sử dụng dầu nông sản nguyên bản.
        </p>
      </div>

      {/* Scientific & Dietary Disclaimer */}
      <div className="knowledge-scientific-disclaimer" style={{ margin: '14px 0 16px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--forest-green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="12" y2="16" />
          </svg>
          <div>
            <strong style={{ display: 'block', fontSize: 13, color: 'var(--forest-green)', marginBottom: 2 }}>
              Cơ sở khoa học &amp; Định hướng dinh dưỡng
            </strong>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
              Các nội dung được tổng hợp đối chiếu theo khuyến nghị của <strong>WHO</strong>, <strong>Harvard T.H. Chan</strong> và <strong>AHA</strong> về chất béo không bão hòa và chế độ ăn cân bằng. Thông tin mang tính chất phổ biến kiến thức, không thay thế chẩn đoán hay phác đồ điều trị y khoa.
            </p>
          </div>
        </div>
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
            <article
              key={art.id}
              className="knowledge-card"
            >
              <Link href={`/knowledge/${art.slug}`} className="knowledge-card-media block">
                <ProductBottleImage type={art.thumbnailType ?? 'peanut'} alt={art.title} />
                <span className="knowledge-cat-badge">{art.categoryName}</span>
              </Link>
              <div className="knowledge-card-body">
                <Link href={`/knowledge/${art.slug}`} className="no-underline">
                  <h4 className="knowledge-card-title">{art.title}</h4>
                </Link>
                <p className="knowledge-card-excerpt">{art.excerpt}</p>

                <div className="article-takeaway-box" style={{ margin: '8px 0 0', padding: '10px 12px' }}>
                  <div className="article-takeaway-title">Điểm cốt lõi</div>
                  <div className="article-takeaway-text" style={{ fontSize: 12.5 }}>
                    {art.takeaway}
                  </div>
                </div>

                {art.sources && art.sources.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <span>Tham khảo: </span>
                    {art.sources.map((s, idx, arr) => (
                      <span key={idx}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: 'var(--peanut-bark)', fontWeight: 500 }}
                        >
                          {s.name} ↗
                        </a>
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                <div className="knowledge-card-meta">
                  <span>{art.readTime}</span>
                  <Link href={`/knowledge/${art.slug}`} style={{ color: 'var(--peanut-bark)', fontWeight: 600 }}>
                    Đọc tiếp →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="empty-search-alert" style={{ display: 'block', margin: '16px var(--screen-pad)' }}>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--soft-sand)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 8, display: 'block' }} aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
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
