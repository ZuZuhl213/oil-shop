import type { Metadata } from 'next';
import Link from 'next/link';
import BottleViewer from '@/components/bottle/BottleViewer';
import styles from './preview.module.css';

export const metadata: Metadata = {
  title: 'Bản xem thử chai dầu 3D',
  robots: { index: false, follow: false },
};

export default function BottlePreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>HM NATURALS</Link>
        <span className={styles.badge}>Bản xem thử · 01</span>
      </header>
      <div className={styles.layout}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Hình dáng tự nhiên</p>
          <h1>Một góc nhìn <br /><em>trong trẻo.</em></h1>
          <p className={styles.description}>Khám phá chai dầu từ mọi góc nhìn. Thân PET trong suốt, những đường gân uốn cong và sắc dầu vàng tự nhiên.</p>
          <dl className={styles.details}>
            <div><dt>Thân chai</dt><dd>PET trong suốt</dd></div>
            <div><dt>Nắp chai</dt><dd>Trắng · gân dọc</dd></div>
            <div><dt>Mức dầu</dt><dd>Khoảng 90% thể tích</dd></div>
            <div><dt>Nhãn sản phẩm</dt><dd>Chưa gắn nhãn</dd></div>
          </dl>
          <p className={styles.note}>Mô hình dựng theo 5 ảnh tham chiếu. Đây là trang xem thử hình dáng, chưa phải bản xác nhận kích thước bao bì.</p>
        </div>
        <BottleViewer />
      </div>
      <footer className={styles.footer}>HM NATURALS <span>Chạm để khám phá. Xoay để cảm nhận.</span></footer>
    </main>
  );
}
