import Image from 'next/image';
import styles from './BottleViewer.module.css';

export default function BottleFallback({ label, message }: { label: string; message?: string }) {
  return (
    <div className={styles.poster}>
      <Image src="/images/bottle-preview.webp" alt={label} width={1000} height={900} unoptimized className={styles.posterImage} />
      {message && <p role="status" className={styles.notice}>{message}</p>}
    </div>
  );
}
