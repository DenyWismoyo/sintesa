'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (val: string) => void;
}

export interface FilterDrawerProps {
  groups: FilterGroup[];
  activeCount?: number;
  onResetAll?: () => void;
  triggerLabel?: string;
  className?: string;
}

export default function FilterDrawer({
  groups,
  activeCount = 0,
  onResetAll,
  triggerLabel = 'Filter & Urutkan',
  className = ''
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mencegah background scroll saat bottom sheet terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* TRIGGER BUTTON (Sangat ergonomis di ponsel & tablet) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl bg-white border border-slate-200/90 text-slate-700 font-bold text-xs sm:text-sm shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0 active:scale-95 ${className}`}
      >
        <SlidersHorizontal size={15} className="text-slate-500" />
        <span>{triggerLabel}</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black">
            {activeCount}
          </span>
        )}
      </button>

      {/* BOTTOM SHEET DRAWER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Bottom Sheet Modal Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative z-10 w-full max-w-xl max-h-[85vh] bg-white rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden pb-safe"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-slate-200" />
              </div>

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-slate-700" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Filter & Pengurutan
                  </h3>
                  {activeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {activeCount} aktif
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {groups.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {group.title}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = group.selectedValue === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => group.onChange(option.id)}
                            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                            }`}
                          >
                            {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                            <span>{option.label}</span>
                            {option.count !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {option.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Footer Actions (Sticky Bottom) */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center gap-3">
                {onResetAll && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetAll();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 min-h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
                  >
                    <RotateCcw size={15} />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center min-h-[46px] px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all"
                >
                  Terapkan Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
