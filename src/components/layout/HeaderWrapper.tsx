'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { ReadingProgressBar } from './ReadingProgressBar';
import { SearchModal } from '../shop/SearchModal';
import { initMagneticButtons, initSmoothScroll, observeReveals } from '@/lib/effects';

export const HeaderWrapper: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add('js');
    const cleanupMag = initMagneticButtons();
    const cleanupSmooth = initSmoothScroll();
    observeReveals();

    return () => {
      cleanupMag();
      cleanupSmooth();
    };
  }, []);

  useEffect(() => {
    // Trigger scroll reveals on page navigation
    const timer = setTimeout(() => {
      observeReveals();
    }, 60);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <ReadingProgressBar />
      <Header onOpenSearch={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

