'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExtendedProductDto } from '@/lib/mock-data';
import { getCategories } from '@/lib/api/categories';
import { getProductBySlug } from '@/lib/api/products';
import { toUiProduct } from '@/lib/catalog-adapter';
import { ProductThumbnail } from '@/components/product/ProductThumbnail';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { useCart } from '@/context/CartContext';
import type { VariantDto } from '@/lib/api/contracts/types';
import { saveQuoteDraft } from '@/lib/checkout-storage';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ExtendedProductDto;
}

export function ProductCardBySlug({ slug }: { slug: string }) {
  const [loaded, setLoaded] = useState<{ slug: string; product: ExtendedProductDto } | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([getProductBySlug(slug), getCategories().catch(() => [])])
      .then(([product, categories]) => {
        if (active) setLoaded({ slug, product: toUiProduct(product, categories.find((category) => category.id === product.categoryId)) });
      })
      .catch(() => { /* An unavailable recommendation must not expose demo variants. */ });
    return () => { active = false; };
  }, [slug]);
  return loaded?.slug === slug ? <ProductCard product={loaded.product} /> : null;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, closeCart } = useCart();
  const router = useRouter();
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const initialFocus = useRef(0);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const isQuote = product.saleType === 'QUOTE';
  const variants = product.status === 'ACTIVE' ? product.variants.filter(variant =>
    variant.isActive && (isQuote || variant.price != null),
  ) : [];
  const defaultVariant = variants[0];
  const outOfStock = variants.length === 0;

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !menu.current || !trigger.current) return;
    const popup = menu.current;
    const button = trigger.current;
    function position() {
      const anchor = button.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(280, window.innerWidth - margin * 2);
      const above = Math.max(0, anchor.top - margin * 2);
      const below = Math.max(0, window.innerHeight - anchor.bottom - margin * 2);
      popup.style.width = `${width}px`;
      popup.style.maxHeight = `${Math.min(280, Math.max(above, below))}px`;
      const height = popup.getBoundingClientRect().height;
      const top = above >= height || above >= below ? anchor.top - height - margin : anchor.bottom + margin;
      popup.style.left = `${Math.max(margin, Math.min(anchor.right - width, window.innerWidth - width - margin))}px`;
      popup.style.top = `${Math.max(margin, Math.min(top, window.innerHeight - height - margin))}px`;
      popup.style.visibility = 'visible';
    }
    position();
    popup.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[initialFocus.current]?.focus({ preventScroll: true });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    }
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, close]);

  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function choose(variant: VariantDto) {
    if (isQuote) {
      saveQuoteDraft(undefined, {
        productId: product.id, productName: product.name, productSlug: product.slug,
        variantId: variant.id, variantName: variant.name, quantity: variant.minQuantity,
        minQuantity: variant.minQuantity, quantityStep: variant.quantityStep, thumbnailType: product.visualType,
      });
      close();
      router.push('/checkout?mode=quote');
      return;
    }
    const result = addItem({
      productId: product.id, productName: product.name, productSlug: product.slug,
      variantId: variant.id, variantName: variant.name, price: variant.price,
      quantity: variant.minQuantity, minQuantity: variant.minQuantity, quantityStep: variant.quantityStep,
      saleType: product.saleType, thumbnailType: product.visualType,
    });
    if (!result.ok) { setFeedback({ error: true, text: result.error.message }); return; }
    // Quick selection stays on the catalog; other add-to-cart entry points keep their drawer behavior.
    closeCart();
    close();
    setFeedback({ error: false, text: 'Đã thêm vào giỏ' });
  }

  return (
    <article className={`grid-product-card group ${styles.card}`} aria-label={product.name}>
      <Link href={`/products/${product.slug}`} className={`${styles.link} no-underline`}>
        <div className="grid-card-thumb">
          <ProductThumbnail url={product.thumbnailUrl} type={product.visualType} alt={product.name} />
          {product.tag ? <span className="grid-card-badge">{product.tag}</span> : !isQuote && defaultVariant && (
            <span className="grid-card-badge" style={{ background: '#FAF6EE', color: '#26402F', border: '1px solid #D9CDBF' }}>{defaultVariant.name}</span>
          )}
        </div>
        <div className="grid-card-body">
          <div>
            <span className="g-cat-text">{product.categoryName || 'Nông Sản Bản Địa'}</span>
            <h4 className="g-title-text group-hover:text-peanut-bark transition-colors">{product.name}</h4>
          </div>
        </div>
      </Link>
      <div className={styles.status}>
        {outOfStock ? <Link href="/contact" className={`g-size-note ${styles.contact}`}>Liên hệ để biết thêm thông tin</Link> : (
          <span className={`g-size-note ${feedback ? styles.feedback : ''}`} role={feedback ? (feedback.error ? 'alert' : 'status') : undefined}>
            {feedback?.text ?? (isQuote ? 'Hàng báo giá sỉ đại lý' : 'Sẵn sàng giao tận bếp')}
          </span>
        )}
      </div>
      <div className={styles.footer}>
        <span className={`${isQuote ? 'g-quote-text' : 'g-price-text'} ${styles.price}`}>
          {isQuote ? 'Yêu cầu báo giá' : formatCurrencyVnd(defaultVariant?.price)}
        </span>
        <button ref={trigger} type="button" className={`${styles.action} ${outOfStock ? styles.soldOut : ''}`} disabled={outOfStock}
          aria-label={`${outOfStock ? 'Hết hàng' : 'Chọn mua'} ${product.name}`} aria-haspopup={outOfStock ? undefined : 'menu'} aria-expanded={!outOfStock && open} aria-controls={outOfStock ? undefined : menuId}
          onClick={() => { if (open) close(); else { initialFocus.current = 0; setFeedback(null); setOpen(true); } }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? variants.length - 1 : 0; setOpen(true);
            }
          }}>{outOfStock ? 'Hết hàng' : 'Chọn mua'}</button>
      </div>
      {open && !outOfStock && createPortal(
        <div ref={menu} id={menuId} role="menu" aria-label={`Chọn quy cách ${product.name}`} className={styles.menu}
          onKeyDown={event => {
            if (event.key === 'Tab') { event.preventDefault(); close(); return; }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
            const current = options.indexOf(document.activeElement as HTMLButtonElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            options[next]?.focus();
          }}>
          {variants.map(variant => <button type="button" role="menuitem" key={variant.id} className={styles.option} onClick={() => choose(variant)}>
            <span>{variant.name}</span>{!isQuote && <span className={styles.optionPrice}>{formatCurrencyVnd(variant.price)}</span>}
          </button>)}
        </div>, document.body,
      )}
    </article>
  );
}
