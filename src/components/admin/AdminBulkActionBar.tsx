"use client";

import React from 'react';
import { CheckSquare, X } from 'lucide-react';

export interface AdminBulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  children: React.ReactNode;
}

export default function AdminBulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  children,
}: AdminBulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] sm:max-w-xl md:max-w-2xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 sm:gap-6">
        {/* Info Terpilih */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
              {selectedCount} item terpilih
            </span>
            {totalCount !== undefined && totalCount > selectedCount && onSelectAll && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-[10px] sm:text-[11px] text-blue-400 hover:text-blue-300 underline font-semibold text-left transition-colors cursor-pointer"
              >
                Pilih semua {totalCount} data
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Slot */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5">
          {children}

          <div className="h-4 w-px bg-slate-700 shrink-0 mx-0.5" />

          {/* Reset / Batal */}
          <button
            type="button"
            onClick={onClearSelection}
            title="Batalkan Pilihan"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

