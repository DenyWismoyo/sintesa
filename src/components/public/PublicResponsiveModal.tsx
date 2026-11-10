'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface PublicResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const MAX_WIDTH_MAP = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export function PublicResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  maxWidth = 'xl',
  className = '',
}: PublicResponsiveModalProps) {
  // ESC shortcut & scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClass = MAX_WIDTH_MAP[maxWidth] || 'sm:max-w-xl';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Container: Bottom-Sheet di Ponsel, Centered Dialog di Desktop/Tablet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`relative z-10 w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0 ${className}`}
          >
            {/* Drag Handle Bar (Khusus Smartphone) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab">
              <div className="w-12 h-1.5 rounded-full bg-slate-200" />
            </div>

            {/* Header Dialog */}
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0 pr-2">
                {badge && <div className="mb-1.5">{badge}</div>}
                <h3 id="modal-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-normal">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 flex items-center justify-center shrink-0 transition-colors"
                aria-label="Tutup jendela"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>

            {/* Footer Aksi (Sticky Bottom Dock) */}
            {footer && (
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex flex-row items-center justify-end gap-2 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default PublicResponsiveModal;

