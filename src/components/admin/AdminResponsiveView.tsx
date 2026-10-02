"use client";

import React from 'react';
import { Loader2, SearchX } from 'lucide-react';

export interface AdminResponsiveViewProps<T> {
  items: T[];
  loading?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  renderDesktopTable: (items: T[]) => React.ReactNode;
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  pagination?: React.ReactNode;
  className?: string;
}

export default function AdminResponsiveView<T>({
  items,
  loading,
  isLoading,
  loadingMessage = "Memuat Data Sistem...",
  emptyTitle = "Data Tidak Ditemukan",
  emptyMessage,
  emptySubtitle,
  emptyAction,
  emptyActionLabel,
  onEmptyAction,
  renderDesktopTable,
  renderMobileCard,
  keyExtractor,
  pagination,
  className = ''
}: AdminResponsiveViewProps<T>) {
  const isCurrentlyLoading = isLoading !== undefined ? isLoading : Boolean(loading);
  const displayEmptyMessage = emptySubtitle || emptyMessage || "Belum ada rekaman data yang sesuai dengan filter pencarian Anda.";

  // 1. STATE LOADING
  if (isCurrentlyLoading && items.length === 0) {
    return (
      <div className={`bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs ${className}`}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-bold text-slate-700">{loadingMessage}</p>
        <p className="text-xs text-slate-400 mt-1">Mengambil informasi terbaru dari basis data.</p>
      </div>
    );
  }

  // 2. STATE KOSONG (EMPTY STATE)
  if (!isCurrentlyLoading && items.length === 0) {
    return (
      <div className={`bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs ${className}`}>
        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 tracking-tight">
          {emptyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md">
          {displayEmptyMessage}
        </p>
        {(emptyAction || (emptyActionLabel && onEmptyAction)) && (
          <div className="mt-5">
            {emptyAction || (
              <button
                onClick={onEmptyAction}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {emptyActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. RENDER DATA (HYBRID DESKTOP TABLE & MOBILE CARD LIST)
  return (
    <div className={`space-y-4 ${className}`}>
      {/* DESKTOP VIEW: Tabel Lengkap (Breakpoint lg ke atas) */}
      <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {renderDesktopTable(items)}
        </div>
      </div>

      {/* MOBILE & TABLET VIEW: Compact Cards (Breakpoint di bawah lg) */}
      <div className="lg:hidden space-y-3">
        {items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : ((item as any)?.id || index);
          return (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 transition-all hover:border-blue-200">
              {renderMobileCard(item, index)}
            </div>
          );
        })}
      </div>

      {/* PAGINATION / FOOTER CONTROLS */}
      {pagination && (
        <div className="pt-2">
          {pagination}
        </div>
      )}
    </div>
  );
}
