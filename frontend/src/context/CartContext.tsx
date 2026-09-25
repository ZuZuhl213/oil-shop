'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        // Initial sample items for realistic preview
        setItems([
          {
            productId: '1',
            productName: 'Dầu Phộng Ép Lạnh Cối Đá',
            productSlug: 'dau-lac-nguyen-chat',
            variantId: '2',
            variantName: '1L',
            price: 170000,
            quantity: 1,
            thumbnailType: 'peanut',
          },
          {
            productId: '2',
            productName: 'Dầu Vừng Ép Lạnh',
            productSlug: 'dau-vung-ep-lanh',
            variantId: '6',
            variantName: '500ml',
            price: 140000,
            quantity: 1,
            thumbnailType: 'sesame',
          },
        ]);
      }
    } catch {
      // Fallback if localStorage is inaccessible
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isInitialized]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = newItem.quantity ?? 1;
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === newItem.variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
        };
        return updated;
      }
      return [...prev, { ...newItem, quantity: qtyToAdd }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const openNav = () => setIsNavOpen(true);
  const closeNav = () => setIsNavOpen(false);

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
        openCart,
        closeCart,
        isNavOpen,
        openNav,
        closeNav,
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
