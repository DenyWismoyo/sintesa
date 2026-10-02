"use client";

import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterSelect {
  id?: string;
  key?: string;
  label: string;
  value: string;
  options: AdminFilterOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export interface AdminFilterBarProps {
  searchTerm?: string;
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminFilterSelect[];
  extraActions?: React.ReactNode;
  totalHits?: number;
  totalLabel?: string;
  activeCount?: number;
  onReset?: () => void;
  className?: string;
}

export default function AdminFilterBar({
  searchTerm,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  extraActions,
  totalHits,
  totalLabel = "data",
  activeCount,
  onReset,
  className = ''
}: AdminFilterBarProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const currentSearch = searchValue !== undefined ? searchValue : (searchTerm || '');

  const hasActiveFilters = activeCount !== undefined 
    ? activeCount > 0 
    : filters.some(f => f.value && f.value !== 'ALL' && f.value !== 'Semua');

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 1. SEARCH INPUT */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {currentSearch && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. DESKTOP FILTERS & COUNTER */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mobile Filter Toggle Button */}
          {filters.length > 0 && (
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className={`sm:hidden flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                hasActiveFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter {hasActiveFilters && '(Aktif)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Desktop Filter Dropdowns */}
          <div className="hidden sm:flex items-center flex-wrap gap-2.5">
            {filters.map((filter, idx) => (
              <div
                key={filter.key || filter.id || `filter-${idx}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
              >
                {filter.icon && <span className="text-slate-400 shrink-0">{filter.icon}</span>}
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none py-1"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {hasActiveFilters && onReset && (
              <button
                onClick={onReset}
                className="text-xs font-bold text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Extra Actions (e.g. Export, Import) */}
          {extraActions && (
            <div className="flex items-center gap-2">
              {extraActions}
            </div>
          )}

          {/* Data Counter */}
          {typeof totalHits === 'number' && (
            <div className="hidden lg:flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              Total: <span className="font-bold text-slate-800 ml-1">{totalHits}</span> {totalLabel}
            </div>
          )}
        </div>
      </div>

      {/* 3. MOBILE FILTER EXPANDABLE PANEL */}
      {isMobileFilterOpen && filters.length > 0 && (
        <div className="sm:hidden pt-3 border-t border-slate-100 grid grid-cols-1 gap-2.5 animate-in slide-in-from-top-2 duration-200">
          {filters.map((filter, idx) => (
            <div key={filter.key || filter.id || `m-filter-${idx}`} className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {filter.label}
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                {filter.icon && <span className="text-slate-400 shrink-0">{filter.icon}</span>}
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full bg-transparent border-none text-xs font-bold text-slate-800 focus:ring-0 outline-none"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {typeof totalHits === 'number' && (
            <div className="text-center py-1 text-xs font-bold text-slate-500">
              Ditemukan {totalHits} {totalLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
