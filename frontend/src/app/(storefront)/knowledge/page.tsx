'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { mockKnowledgeArticles } from '@/lib/mock-data';

const categories = [
  { key: 'all', name: 'Tất cả' },
  { key: 'oil-knowledge', name: 'Kiến thức dầu' },
  { key: 'kitchen-tips', name: 'Cách sử dụng' },
  { key: 'skin-care', name: 'Chăm sóc da' },
];

export default function KnowledgePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const filteredArticles = mockKnowledgeArticles.filter((article) => {
    if (selectedCategory !== 'all' && article.categoryKey !== selectedCategory) return false;
    const query = keyword.toLocaleLowerCase('vi').trim();
    return !query || [article.title, article.excerpt, article.takeaway, article.introduction,
      ...article.sections.map((section) => section.title),
    ].some((text) => text.toLocaleLowerCase('vi').includes(query));
  });

  return (
    <div className="site-container knowledge-hub">
      <header className="knowledge-listing-head">
        <span className="section-eyebrow">Từ căn bếp đến chăm sóc bản thân</span>
        <h1 className="section-title">Góc kiến thức</h1>
        <p className="knowledge-intro">Kiến thức về dầu thực vật, cách dùng trong bếp và chăm sóc da.</p>
      </header>

      <div className="knowledge-editor-note">
        <BookOpen size={19} aria-hidden="true" />
        <p>Hướng dẫn thực hành, kèm lưu ý và nguồn đọc thêm cho từng bài.</p>
      </div>

      <div className="knowledge-search-bar">
        <Search size={18} aria-hidden="true" />
        <input type="search" className="knowledge-search-input" placeholder="Tìm dầu lạc, dầu vừng, dưỡng ẩm..."
          aria-label="Tìm bài viết" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      </div>

      <div className="knowledge-filters" role="group" aria-label="Chủ đề bài viết">
        {categories.map((category) => (
          <button key={category.key} type="button"
            className={`cat-chip-btn ${selectedCategory === category.key ? 'active' : ''}`}
            aria-pressed={selectedCategory === category.key} onClick={() => setSelectedCategory(category.key)}>
            {category.name}
          </button>
        ))}
      </div>
      <p className="knowledge-result-count" role="status" aria-live="polite">{filteredArticles.length} bài viết</p>

      {filteredArticles.length ? (
        <div className="knowledge-featured-list">
          {filteredArticles.map((article, index) => (
            <Link key={article.id} href={`/knowledge/${article.slug}`} className="knowledge-card"
              aria-label={`Xem bài viết: ${article.title}`}>
              <div className="knowledge-card-media">
                <Image src={article.imageUrl} alt={article.title} width={800} height={450}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                <span className="knowledge-cat-badge">{article.categoryName}</span>
              </div>
              <div className="knowledge-card-body">
                <h2 className="knowledge-card-title">{article.title}</h2>
                <p className="knowledge-card-excerpt">{article.excerpt}</p>
                <span className="knowledge-card-action">Xem bài viết <ArrowRight size={16} aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="knowledge-empty">
          <Search size={30} aria-hidden="true" />
          <h2>Chưa tìm thấy bài phù hợp</h2>
          <p>Thử từ khóa khác hoặc xem lại tất cả bài viết.</p>
          <button type="button" className="btn-action-touch quote-flow"
            onClick={() => { setSelectedCategory('all'); setKeyword(''); }}>Xem tất cả bài viết</button>
        </div>
      )}
    </div>
  );
}
