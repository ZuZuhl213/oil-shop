'use client';

import dynamic from 'next/dynamic';
import { Component, createContext, useContext, useState, type ReactNode } from 'react';
import BottleFallback from './BottleFallback';
import styles from './BottleViewer.module.css';

const defaultLabel = 'Chai dầu HM NATURALS 3D, chai PET trong suốt, nắp trắng, chưa có nhãn';
const LabelContext = createContext(defaultLabel);

function LoadingView() {
  const label = useContext(LabelContext);
  return <div className={styles.stage}><BottleFallback label={label} message="Đang tải trình xem 3D…" /></div>;
}

const BottleCanvas = dynamic(() => import('./BottleCanvas'), {
  ssr: false,
  loading: LoadingView,
});

class RenderBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export type BottleViewerProps = {
  className?: string;
  /** Accessible description for both the canvas and its rendered still. */
  label?: string;
};

export default function BottleViewer({ className = '', label = defaultLabel }: BottleViewerProps) {
  const [attempt, setAttempt] = useState(0);
  const renderFallback = (reload: boolean) => (
    <>
      <div className={styles.stage}>
        <BottleFallback label={label} message="Không thể hiển thị 3D. Đang hiển thị ảnh tĩnh của mô hình." />
      </div>
      <div className={styles.recovery}>
        <button type="button" onClick={() => reload ? window.location.reload() : setAttempt(value => value + 1)}>
          {reload ? 'Tải lại trang' : 'Thử lại 3D'}
        </button>
      </div>
    </>
  );
  return (
    <section className={`${styles.viewer} ${className}`} aria-label="Trình xem chai dầu 360 độ">
      <noscript><p className={styles.hint}>Đang hiển thị ảnh tĩnh. Bật JavaScript để xoay và thu phóng chai dầu.</p></noscript>
      <RenderBoundary key={attempt} fallback={renderFallback(true)}>
        <LabelContext value={label}><BottleCanvas label={label} fallback={renderFallback(false)} /></LabelContext>
      </RenderBoundary>
    </section>
  );
}
