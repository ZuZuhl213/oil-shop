'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer';

export function StorefrontProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
      <MobileNavDrawer />
    </CartProvider>
  );
}
