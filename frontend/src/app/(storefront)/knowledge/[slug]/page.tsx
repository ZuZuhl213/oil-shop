import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMockArticleBySlug, getMockProductBySlug, mockKnowledgeArticles } from '@/lib/mock-data';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { ProductCard } from '@/components/product/ProductCard';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function KnowledgeArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getMockArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedProduct = article.relatedProductSlug
    ? getMockProductBySlug(article.relatedProductSlug)
    : null;

  const relatedArticles = mockKnowledgeArticles
    .filter((a) => a.id !== article.id && a.categoryKey === article.categoryKey)
    .slice(0, 2);

  return (
    <article className="article-detail-wrap">
      {/* Back nav */}
      <Link href="/knowledge" className="article-back-nav">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Quay lại Góc kiến thức</span>
      </Link>

      {/* Header */}
      <div className="article-header">
        <div className="article-meta-row">
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 99,
              background: 'var(--peanut-gold-surface)',
              color: 'var(--peanut-bark)',
            }}
          >
            {article.categoryName}
          </span>
          <span>{article.date}</span>
          <span>•</span>
          <span>{article.readTime}</span>
        </div>
        <h1 className="article-detail-title">{article.title}</h1>
      </div>

      {/* Cover Image Container */}
      <div className="article-cover-box">
        <ProductBottleImage type={article.thumbnailType ?? 'peanut'} alt={article.title} />
      </div>

      {/* Key Takeaway Card */}
      <div className="article-takeaway-box">
        <div className="article-takeaway-title">💡 Điểm cốt lõi cần nhớ</div>
        <div className="article-takeaway-text">{article.takeaway}</div>
      </div>

      {/* Rich Editorial Body Text */}
      <div
        className="article-body-text"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {/* Related Products Section */}
      {relatedProduct && (
        <div className="article-related-box" id="artRelatedProductsBox">
          <span className="section-eyebrow">Nông phẩm đề xuất trong bài</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--forest-green)', margin: '4px 0 12px' }}>
            Sản Phẩm Khuyên Dùng
          </h3>
          <div className="max-w-xs">
            <ProductCard product={relatedProduct} />
          </div>
        </div>
      )}

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <div className="article-related-box" id="artRelatedArticlesBox" style={{ marginTop: 24 }}>
          <span className="section-eyebrow">Đọc tiếp cùng chuyên mục</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--forest-green)', margin: '4px 0 12px' }}>
            Bài Viết Liên Quan
          </h3>
          <div className="knowledge-featured-list" style={{ padding: 0 }}>
            {relatedArticles.map((rel) => (
              <Link key={rel.id} href={`/knowledge/${rel.slug}`} className="knowledge-card">
                <div className="knowledge-card-body">
                  <h4 className="knowledge-card-title">{rel.title}</h4>
                  <p className="knowledge-card-excerpt">{rel.excerpt}</p>
                  <div className="knowledge-card-meta">
                    <span>⏱ {rel.readTime}</span>
                    <span>Đọc tiếp →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <Link
          href="/knowledge"
          className="btn-action-touch quote-flow no-underline inline-flex"
          style={{ width: '100%' }}
        >
          ← Khám Phá Thêm Bài Viết Khác
        </Link>
      </div>
    </article>
  );
}
