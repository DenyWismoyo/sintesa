// Lokasi: src/components/common/ReadingProgress.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ReadingProgressProps {
  color?: string;
  height?: number;
}

export function ReadingProgress({
  color = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600',
  height = 3
}: ReadingProgressProps) {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setCompletion(
          Number((currentProgress / scrollHeight).toFixed(3)) * 100
        );
      }
    };

    window.addEventListener('scroll', updateScrollCompletion, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollCompletion);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full z-50 pointer-events-none bg-transparent"
      style={{ height: `${height}px` }}
    >
      <div
        className={`h-full transition-all duration-75 ease-out shadow-xs ${color}`}
        style={{ width: `${completion}%` }}
      />
    </div>
  );
}
