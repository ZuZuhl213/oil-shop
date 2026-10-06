import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Lightbulb } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getMockArticleBySlug, mockKnowledgeArticles } from '@/lib/mock-data';
import { ProductCardBySlug } from '@/components/product/ProductCard';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function KnowledgeArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getMockArticleBySlug(slug);
  if (!article) notFound();
  const otherArticles = mockKnowledgeArticles.filter((item) => item.id !== article.id);
  const relatedArticles = [
    ...otherArticles.filter((item) => item.categoryKey === article.categoryKey),
    ...otherArticles.filter((item) => item.categoryKey !== article.categoryKey),
  ].slice(0, 2);

  return (
    <article className="article-detail-wrap knowledge-article">
      <Link href="/knowledge" className="article-back-nav"><ArrowLeft size={18} aria-hidden="true" />Quay lại Góc kiến thức</Link>
      <header className="article-header">
        <div className="article-meta-row"><span className="article-topic">{article.categoryName}</span></div>
        <h1 className="article-detail-title">{article.title}</h1>
        <p className="article-introduction">{article.introduction}</p>
      </header>

      <figure className="article-figure">
        <div className="article-cover-box">
          <Image src={article.imageUrl} alt={article.title} width={800} height={450} loading="eager"
            sizes="(min-width: 768px) 760px, 100vw" />
        </div>
        {article.imageSource && <figcaption>Ảnh minh họa: <a href={article.imageSource.url} target="_blank" rel="noopener noreferrer">
          {article.imageSource.name} <ArrowUpRight size={12} aria-hidden="true" /></a></figcaption>}
      </figure>

      <div className="article-takeaway-box">
        <div className="article-takeaway-title"><Lightbulb size={17} aria-hidden="true" />Điều cần nhớ</div>
        <p className="article-takeaway-text">{article.takeaway}</p>
      </div>

      <nav className="article-contents" aria-label="Mục lục bài viết">
        <h2>Trong bài viết này</h2>
        <ol>{article.sections.map((section, index) => <li key={section.id}>
          <a href={`#${section.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{section.title}</a>
        </li>)}</ol>
      </nav>

      <div className="article-body-text" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />

      {article.sources?.length ? <aside className="article-sources" aria-label="Nguồn tham khảo">
        <h2><BookOpen size={18} aria-hidden="true" />Nguồn đọc thêm</h2>
        <ul>{article.sources.map((source) => <li key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<ArrowUpRight size={14} aria-hidden="true" /></a>
        </li>)}</ul>
      </aside> : null}
      <p className="article-editorial-note">{article.disclaimer}</p>

      {article.relatedProductSlug && <section className="article-related-box" aria-labelledby="related-product-heading">
        <span className="section-eyebrow">Khám phá nông phẩm</span>
        <h2 id="related-product-heading">Sản phẩm liên quan</h2>
        <div className="max-w-xs"><ProductCardBySlug slug={article.relatedProductSlug} /></div>
      </section>}

      <section className="article-related-box" aria-labelledby="related-articles-heading">
        <span className="section-eyebrow">Tiếp tục khám phá</span>
        <h2 id="related-articles-heading">Có thể bạn quan tâm</h2>
        <div className="article-related-cards">{relatedArticles.map((related) => (
          <Link key={related.id} href={`/knowledge/${related.slug}`} className="article-related-card">
            <span className="article-related-category">{related.categoryName}</span>
            <h3>{related.title}</h3>
            <span className="knowledge-card-action">Xem bài viết <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>
        ))}</div>
      </section>
      <Link href="/knowledge" className="article-return-link"><ArrowLeft size={16} aria-hidden="true" />Xem tất cả bài viết</Link>
    </article>
  );
}
