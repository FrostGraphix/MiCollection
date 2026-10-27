'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { ReadingProgressBar } from './ReadingProgressBar';
import { SearchModal } from '../shop/SearchModal';
import { initMagneticButtons } from '@/lib/effects';

export const HeaderWrapper: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const cleanup = initMagneticButtons();
    return () => cleanup();
  }, []);

  return (
    <>
      <ReadingProgressBar />
      <Header onOpenSearch={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

