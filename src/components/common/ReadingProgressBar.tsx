// Lokasi file: src/components/common/ReadingProgressBar.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ReadingProgressBarProps {
  colorClassName?: string;
}

export function ReadingProgressBar({
  colorClassName = 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500'
}: ReadingProgressBarProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (scrollProgress <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-slate-100/60 pointer-events-none">
      <div
        className={`h-full transition-all duration-100 ease-out ${colorClassName}`}
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
