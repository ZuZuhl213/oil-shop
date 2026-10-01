'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import { ProductBottleImage, type ProductVisualType } from './ProductBottleImage';
import styles from './Product360Modal.module.css';

const BottleScene = dynamic(() => import('./BottleScene'), {
  ssr: false,
  loading: () => <div className={styles.stage}><p role="status" className={styles.loading}>Đang tải mô hình 3D…</p></div>,
});

class ViewerBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function Bottle3DViewer({ productName, visualType }: { productName: string; visualType: ProductVisualType }) {
  const fallback = (
    <div>
      <div className={styles.stage}><ProductBottleImage type={visualType} alt={productName} /></div>
      <p role="status" className={styles.hint}>Không thể hiển thị 3D. Bạn vẫn có thể xem ảnh minh họa sản phẩm.</p>
    </div>
  );
  return <ViewerBoundary fallback={fallback}><BottleScene fallback={fallback} /></ViewerBoundary>;
}
