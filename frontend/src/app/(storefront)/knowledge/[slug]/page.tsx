import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMockArticleBySlug, mockKnowledgeArticles } from '@/lib/mock-data';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { ProductCardBySlug } from '@/components/product/ProductCard';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function KnowledgeArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getMockArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedProduct = article.relatedProductSlug;

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

      {/* Scientific References */}
      {article.sources && article.sources.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: '16px 18px',
            background: 'var(--white-pure)',
            border: '1px solid var(--soft-sand)',
            borderRadius: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 15 }}>📚</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--forest-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tài Liệu Tham Khảo Khoa Học
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            {article.sources.map((src, i) => (
              <li key={i}>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--peanut-bark)', fontWeight: 500, textDecoration: 'none' }}
                  className="hover:underline"
                >
                  {src.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scientific & Dietary Disclaimer */}
      <div
        className="knowledge-scientific-disclaimer"
        style={{ marginTop: 16 }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--text-muted)' }}>
          {article.disclaimer || '⚠️ Lưu ý y khoa: Thông tin trong bài viết nhằm mục đích phổ biến kiến thức dinh dưỡng tổng quát dựa trên các hướng dẫn của WHO và AHA. Sản phẩm dầu nông sản là thực phẩm phục vụ nấu ăn hàng ngày, không phải thuốc và không có tác dụng thay thế thuốc chữa bệnh.'}
        </p>
      </div>

      {/* Related Products Section */}
      {relatedProduct && (
        <div className="article-related-box" id="artRelatedProductsBox">
          <span className="section-eyebrow">Nông phẩm đề xuất trong bài</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--forest-green)', margin: '4px 0 12px' }}>
            Sản Phẩm Khuyên Dùng
          </h3>
          <div className="max-w-xs">
            <ProductCardBySlug slug={relatedProduct} />
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
