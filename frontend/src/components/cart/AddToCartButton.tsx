'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import type { CartItemInput } from '@/features/cart/cart-types';

interface AddToCartButtonProps {
  item: CartItemInput;
  label: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function AddToCartButton({
  item,
  label,
  className = 'btn-action-touch fixed-flow',
  disabled = false,
  'aria-label': ariaLabel,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => addItem(item)}
    >
      {label}
    </button>
  );
}
