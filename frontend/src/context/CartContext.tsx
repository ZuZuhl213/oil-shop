'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { CartAction, CartActionError, CartActionResult, CartItem, CartItemInput, CartState } from '@/features/cart/cart-types';
import { applyCartAction, cartMatchesItems, EMPTY_CART, getCartSubtotal, resultForTransition } from '@/features/cart/cart-store';
import { CART_STORAGE_KEY, cartStorageWarningMessage, parseCartStorageValue, readCart, writeCart } from '@/features/cart/cart-storage';

export type { CartItem } from '@/features/cart/cart-types';

interface CartContextType {
  items: CartItem[];
  saleType: CartState['saleType'];
  addItem: (item: CartItemInput) => CartActionResult;
  removeItem: (variantId: string) => CartActionResult;
  updateQuantity: (variantId: string, quantity: number) => CartActionResult;
  changeVariant: (variantId: string, item: CartItemInput) => CartActionResult;
  clearCart: () => CartActionResult;
  clearCartIfMatches: (items: ReadonlyArray<Pick<CartItem, 'variantId' | 'quantity'>>) => boolean;
  totalItems: number;
  subtotal: number | null;
  storageMessage: string | null;
  actionError: CartActionError | null;
  clearActionError: () => void;
  isHydrated: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isNavOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<CartActionError | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const cartRef = useRef<CartState>(EMPTY_CART);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);

  const setHydratedCart = useCallback((nextCart: CartState, message: string | null = null) => {
    cartRef.current = nextCart;
    dirtyRef.current = false;
    setCart(nextCart);
    setStorageMessage(message);
    setActionError(null);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      const loaded = readCart();
      setHydratedCart(loaded.state, cartStorageWarningMessage(loaded.warning));
      hydratedRef.current = true;
      setIsHydrated(true);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      if (event.key === null) {
        setHydratedCart(EMPTY_CART);
        return;
      }
      const loaded = parseCartStorageValue(event.newValue);
      if (loaded.warning === 'invalid') {
        try { window.localStorage.removeItem(CART_STORAGE_KEY); } catch { /* best effort cleanup */ }
      }
      setHydratedCart(loaded.state, cartStorageWarningMessage(loaded.warning));
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setHydratedCart]);

  useEffect(() => {
    if (!isHydrated || !dirtyRef.current) return;
    dirtyRef.current = false;
    const result = writeCart(cart);
    setStorageMessage(cartStorageWarningMessage(result.warning));
  }, [cart, isHydrated]);

  const apply = useCallback((action: CartAction, openOnError = false): CartActionResult => {
    if (!hydratedRef.current) {
      const loaded = readCart();
      cartRef.current = loaded.state;
      setCart(loaded.state);
      setStorageMessage(cartStorageWarningMessage(loaded.warning));
      hydratedRef.current = true;
      setIsHydrated(true);
    }

    const transition = applyCartAction(cartRef.current, action);
    const result = resultForTransition(transition);
    if (!result.ok) {
      setActionError(result.error);
      if (openOnError) setIsCartOpen(true);
      return result;
    }

    setActionError(null);
    if (action.type !== 'hydrate') {
      cartRef.current = transition.state;
      dirtyRef.current = true;
      setCart(transition.state);
    }
    return { ok: true };
  }, []);

  const addItem = useCallback((item: CartItemInput) => {
    const result = apply({ type: 'add', item }, true);
    if (result.ok) setIsCartOpen(true);
    return result;
  }, [apply]);

  const removeItem = useCallback((variantId: string) => apply({ type: 'remove', variantId }), [apply]);
  const updateQuantity = useCallback((variantId: string, quantity: number) => apply({ type: 'setQuantity', variantId, quantity }), [apply]);
  const changeVariant = useCallback((variantId: string, item: CartItemInput) => apply({ type: 'changeVariant', variantId, item }), [apply]);
  const clearCart = useCallback(() => apply({ type: 'clear' }), [apply]);
  const clearCartIfMatches = useCallback((items: ReadonlyArray<Pick<CartItem, 'variantId' | 'quantity'>>) => {
    if (!cartMatchesItems(cartRef.current, items)) return false;
    return apply({ type: 'clear' }).ok;
  }, [apply]);

  const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getCartSubtotal(cart);

  return (
    <CartContext.Provider value={{
      items: cart.items,
      saleType: cart.saleType,
      addItem,
      removeItem,
      updateQuantity,
      changeVariant,
      clearCart,
      clearCartIfMatches,
      totalItems,
      subtotal,
      storageMessage,
      actionError,
      clearActionError: () => setActionError(null),
      isHydrated,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      isNavOpen,
      openNav: () => setIsNavOpen(true),
      closeNav: () => setIsNavOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
