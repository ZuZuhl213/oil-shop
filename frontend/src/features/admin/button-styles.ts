import styles from './AdminButton.module.css';

export type AdminButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export function adminButtonClass(variant: AdminButtonVariant = 'neutral'): string {
  return `${styles.button} ${styles[variant]}`;
}
