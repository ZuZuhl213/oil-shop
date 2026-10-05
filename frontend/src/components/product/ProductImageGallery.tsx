'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProductImageDto } from '@/lib/api/contracts/types';
import type { ProductVisualType } from './ProductBottleImage';
import { ProductThumbnail } from './ProductThumbnail';
import styles from './ProductImageGallery.module.css';

type Props = { images?: ProductImageDto[]; thumbnailUrl?: string | null; name: string; type: ProductVisualType };

export function ProductImageGallery({ images = [], thumbnailUrl, name, type }: Props) {
  const urls = images.length ? [...images].sort((a, b) => a.sortOrder - b.sortOrder).map((image) => image.url) : thumbnailUrl ? [thumbnailUrl] : [];
  return <Gallery key={JSON.stringify([name, urls])} urls={urls} name={name} type={type} />;
}

function Gallery({ urls, name, type }: { urls: string[]; name: string; type: ProductVisualType }) {
  const root = useRef<HTMLDivElement>(null);
  const pointerPlayback = useRef<boolean | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [inView, setInView] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const multiple = urls.length > 1;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (media?.matches) setPlaying(false); };
    media?.addEventListener('change', reduce);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    if (root.current) observer?.observe(root.current);
    return () => { document.removeEventListener('visibilitychange', update); media?.removeEventListener('change', reduce); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (!multiple || !playing || hovered || focused || !visible || !inView) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % urls.length), 5000);
    return () => window.clearTimeout(timer);
  }, [index, urls.length, multiple, playing, hovered, focused, visible, inView]);

  useEffect(() => {
    if (!multiple) return;
    const next = new window.Image(); next.src = urls[(index + 1) % urls.length];
  }, [index, multiple, urls]);

  function select(value: number) {
    const next = (value + urls.length) % urls.length;
    setIndex(next); setPlaying(false); setAnnouncement(`Ảnh ${next + 1} trên ${urls.length}`);
  }
  return <div ref={root} role="region" aria-roledescription={multiple ? 'carousel' : undefined} aria-label={`Ảnh sản phẩm ${name}`} className={styles.gallery}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => { setFocused(true); setPlaying(false); }}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    onKeyDown={(event) => {
      if (!multiple || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); select(index + (event.key === 'ArrowRight' ? 1 : -1));
    }}>
    <div className={styles.image} data-testid="gallery-swipe" onPointerDown={(event) => {
      if (!multiple || !event.isPrimary || event.button !== 0) return;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }} onPointerUp={(event) => {
      const start = gesture.current; gesture.current = null;
      if (!start || start.id !== event.pointerId) return;
      const x = event.clientX - start.x; const y = event.clientY - start.y;
      if (Math.abs(x) >= 40 && Math.abs(x) > Math.abs(y)) select(index + (x < 0 ? 1 : -1));
    }} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
      <ProductThumbnail key={urls[index] ?? 'fallback'} url={urls[index]} type={type} alt={urls.length ? `${name} — ảnh ${index + 1} trên ${urls.length}` : name} illustrationLabel="Ảnh mẫu minh họa" />
    </div>
    {multiple && <>
      <button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label="Ảnh trước" onClick={() => select(index - 1)}>‹</button>
      <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Ảnh tiếp theo" onClick={() => select(index + 1)}>›</button>
      <div className={styles.controls}>
        <div className={styles.dots} aria-label="Chọn ảnh">{urls.map((url, i) => <button type="button" key={url} className={styles.dot} aria-label={`Xem ảnh ${i + 1}`} aria-current={i === index ? 'true' : undefined} onClick={() => select(i)}><span /></button>)}</div>
        <button type="button" data-autoplay onPointerDown={() => { pointerPlayback.current = !playing; }} onPointerCancel={() => { pointerPlayback.current = null; }} className={styles.play} aria-label={playing ? 'Dừng tự động' : 'Phát tự động'} onClick={() => {
          const next = pointerPlayback.current ?? !playing;
          pointerPlayback.current = null;
          setPlaying(next);
          // Explicit Play overrides a prior focus pause without moving keyboard focus.
          if (next) setFocused(false);
        }}>{playing ? 'Dừng' : 'Phát'}</button>
      </div>
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</span>
    </>}
  </div>;
}
