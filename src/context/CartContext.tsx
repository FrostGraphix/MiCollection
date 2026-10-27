'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, ColorKey, DeliveryType } from '@/types';
import { byId, CFG } from '@/lib/products';
import { lineKey } from '@/lib/utils';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  promoApplied: boolean;
  promoCode: string;
  isDrawerOpen: boolean;
  addToCart: (id: number, color?: ColorKey, size?: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  applyPromo: (code: string) => { success: boolean; message: string };
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  feeOf: (opt: DeliveryType) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mic_cart');
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        setCart(parsed.filter((item) => byId(item.id)));
      }
      const storedPromo = localStorage.getItem('mic_promo');
      if (storedPromo) {
        setPromoApplied(true);
        setPromoCode(storedPromo);
      }
    } catch {}
  }, []);

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    try {
      localStorage.setItem('mic_cart', JSON.stringify(updatedCart));
    } catch {}
  };

  const addToCart = (
    id: number,
    color?: ColorKey,
    size?: string,
    qty = 1
  ) => {
    const product = byId(id);
    if (!product) return;

    const chosenColor = color || product.colors[0];
    const chosenSize = size || (product.sizes ? product.sizes[0] : '');
    const key = lineKey({ id, color: chosenColor, size: chosenSize });

    const existingIndex = cart.findIndex((item) => lineKey(item) === key);
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].qty = Math.min(20, updated[existingIndex].qty + qty);
    } else {
      updated = [...cart, { id, color: chosenColor, size: chosenSize, qty }];
    }

    saveCart(updated);
  };

  const setQty = (key: string, qty: number) => {
    if (qty <= 0) {
      removeItem(key);
      return;
    }
    const updated = cart.map((item) => {
      if (lineKey(item) === key) {
        return { ...item, qty: Math.min(20, qty) };
      }
      return item;
    });
    saveCart(updated);
  };

  const removeItem = (key: string) => {
    const updated = cart.filter((item) => lineKey(item) !== key);
    saveCart(updated);
  };

  const applyPromo = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === CFG.promo.code) {
      setPromoApplied(true);
      setPromoCode(trimmed);
      try {
        localStorage.setItem('mic_promo', trimmed);
      } catch {}
      return { success: true, message: `${CFG.promo.pct}% discount applied!` };
    }
    setPromoApplied(false);
    setPromoCode('');
    try {
      localStorage.removeItem('mic_promo');
    } catch {}
    return { success: false, message: 'Invalid promo code. Try WELCOME10' };
  };

  const clearCart = () => {
    saveCart([]);
    setPromoApplied(false);
    setPromoCode('');
    try {
      localStorage.removeItem('mic_promo');
    } catch {}
  };

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const subtotal = cart.reduce((total, item) => {
    const product = byId(item.id);
    return total + (product ? product.price * item.qty : 0);
  }, 0);

  const discount = promoApplied ? Math.round((subtotal * CFG.promo.pct) / 100) : 0;

  const feeOf = (opt: DeliveryType) => {
    if (subtotal - discount >= CFG.freeOver && opt !== 'pickup') {
      return 0;
    }
    return CFG.delivery[opt]?.fee ?? 2500;
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        discount,
        promoApplied,
        promoCode,
        isDrawerOpen,
        addToCart,
        setQty,
        removeItem,
        applyPromo,
        clearCart,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        feeOf,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
