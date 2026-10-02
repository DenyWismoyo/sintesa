// Lokasi: src/components/common/StickyActionBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyActionBarProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function StickyActionBar({
  children,
  threshold = 350,
  className = ''
}: StickyActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl py-3 px-4 sm:px-8 ${className}`}
        >
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
