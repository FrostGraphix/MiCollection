'use client';

import React, { useEffect, useRef } from 'react';

export const ReadingProgressBar: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0 && barRef.current) {
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const loop = () => {
      handleScroll();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <div ref={barRef} className="prog-bar" aria-hidden="true" />;
};
