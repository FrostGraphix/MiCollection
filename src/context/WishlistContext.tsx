'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface WishlistContextType {
  wishlist: number[];
  toggleWishlist: (id: number) => boolean;
  isInWishlist: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mic_wish');
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch {
      // Ignore parse error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleWishlist = (id: number): boolean => {
    const exists = wishlist.includes(id);
    let updated: number[];
    if (exists) {
      updated = wishlist.filter((item) => item !== id);
    } else {
      updated = [...wishlist, id];
    }
    setWishlist(updated);
    try {
      localStorage.setItem('mic_wish', JSON.stringify(updated));
    } catch {}
    return !exists;
  };

  const isInWishlist = (id: number) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
