'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import Bottle3DViewer from './Bottle3DViewer';
import type { ProductVisualType } from './ProductBottleImage';
import styles from './Product360Modal.module.css';

interface Props {
  productName: string;
  visualType: ProductVisualType;
  onClose: () => void;
}

export default function Product360Modal({ productName, visualType, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'))
          .filter(element => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>Xem chai dầu 360°</h2>
          <p>{productName}</p>
        </div>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={onClose} autoFocus>
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <p id={descriptionId} className={styles.note}>Mô hình minh họa, chưa phải hình dáng và bao bì thực tế của sản phẩm.</p>
      <Bottle3DViewer productName={productName} visualType={visualType} />
    </dialog>
  );
}
