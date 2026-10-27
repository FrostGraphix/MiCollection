'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { SearchModal } from '../shop/SearchModal';

export const HeaderWrapper: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Header onOpenSearch={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
