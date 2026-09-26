'use client';

/* eslint-disable react-hooks/set-state-in-effect -- browser hydration/API synchronization */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SaleType } from '@/lib/api/contracts/types';

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  minQuantity?: number;
  quantityStep?: number;
  saleType?: SaleType;
  thumbnailType: 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isNavOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'hm_naturals_cart_v1';
const THUMBNAIL_TYPES = new Set<CartItem['thumbnailType']>([
  'peanut',
  'sesame',
  'sachi',
  'byproduct',
  'gac',
  'coconut',
  'seeds',
]);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.productSlug === 'string' &&
    typeof item.variantId === 'string' &&
    typeof item.variantName === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    (item.minQuantity === undefined || (typeof item.minQuantity === 'number' && item.minQuantity > 0)) &&
    (item.quantityStep === undefined || (typeof item.quantityStep === 'number' && item.quantityStep > 0)) &&
    (item.saleType === undefined || item.saleType === 'FIXED_PRICE' || item.saleType === 'QUOTE') &&
    THUMBNAIL_TYPES.has(item.thumbnailType as CartItem['thumbnailType'])
  );
}

interface StoredCart {
  version: 1;
  saleType: SaleType | null;
  items: CartItem[];
}

function readStoredItems(): CartItem[] {
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    const items = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && (parsed as Partial<StoredCart>).version === 1
        ? (parsed as Partial<StoredCart>).items
        : null;
    if (!Array.isArray(items) || !items.every(isCartItem)) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('hm-cart-storage-invalid'));
      return [];
    }
    return items;
  } catch {
    window.dispatchEvent(new CustomEvent('hm-cart-storage-unavailable'));
    return [];
  }
}

function roundQuantity(quantity: number): number {
  return Math.round(quantity * 1_000_000) / 1_000_000;
}

function normalizeQuantity(quantity: number, minQuantity = 1, quantityStep = 1): number {
  const minimum = Math.max(0.01, minQuantity);
  const step = Math.max(0.01, quantityStep);
  if (!Number.isFinite(quantity)) return minimum;
  const steps = Math.max(0, Math.round((quantity - minimum) / step));
  return roundQuantity(minimum + steps * step);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const stored: StoredCart = {
        version: 1,
        saleType: items.length ? (items[0].saleType ?? 'FIXED_PRICE') : null,
        items,
      };
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      window.dispatchEvent(new CustomEvent('hm-cart-storage-unavailable'));
    }
  }, [items, isInitialized]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const minQuantity = newItem.minQuantity ?? 1;
    const quantityStep = newItem.quantityStep ?? 1;
    const qtyToAdd = normalizeQuantity(newItem.quantity ?? minQuantity, minQuantity, quantityStep);
    setItems((previous) => {
      const existingIndex = previous.findIndex((item) => item.variantId === newItem.variantId);
      if (existingIndex < 0) {
        return [...previous, { ...newItem, quantity: qtyToAdd, minQuantity, quantityStep }];
      }
      const updated = [...previous];
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        quantity: normalizeQuantity(existing.quantity + qtyToAdd, existing.minQuantity ?? minQuantity, existing.quantityStep ?? quantityStep),
      };
      return updated;
    });
    setIsCartOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((previous) => previous.filter((item) => item.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((previous) =>
      previous.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: normalizeQuantity(quantity, item.minQuantity, item.quantityStep) }
          : item,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        isNavOpen,
        openNav: () => setIsNavOpen(true),
        closeNav: () => setIsNavOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
