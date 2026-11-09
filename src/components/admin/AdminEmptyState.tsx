"use client";

import React from 'react';
import { Inbox, Plus, RotateCcw } from 'lucide-react';

export interface AdminEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function AdminEmptyState({
  icon: IconComponent = Inbox,
  title = 'Tidak Ada Data Ditemukan',
  description = 'Belum ada data pada filter atau kategori ini.',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: AdminEmptyStateProps) {
  return (
    <div
      className={`py-12 sm:py-16 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100/90 text-slate-400 flex items-center justify-center mb-4 border border-slate-200/60 shadow-2xs">
        <IconComponent className="w-6 h-6" />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
        {title}
      </h4>

      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
        {description}
      </p>

      {(onAction || onSecondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{actionLabel || 'Tambah Data'}</span>
            </button>
          )}

          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{secondaryActionLabel || 'Reset Filter'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

