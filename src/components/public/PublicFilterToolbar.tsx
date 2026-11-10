'use client';

import React from 'react';
import { Search, X, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import PillTabs, { PillTabItem } from '@/components/ui/PillTabs';
import FilterDrawer, { FilterGroup } from '@/components/ui/FilterDrawer';

export interface SortOption {
  value: string;
  label: string;
}

export interface PublicFilterToolbarProps {
  // Pencarian
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Kategori Pill Tabs
  tabs?: (PillTabItem | string)[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabLayoutId?: string;

  // Pengurutan
  sortValue?: string;
  onSortChange?: (val: string) => void;
  sortOptions?: SortOption[];

  // Mobile Filter Drawer
  filterGroups?: FilterGroup[];
  activeFilterCount?: number;
  onResetFilters?: () => void;
  drawerTriggerLabel?: string;

  // Custom slots
  actions?: React.ReactNode;
  className?: string;
}

export function PublicFilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  tabs,
  activeTab,
  onTabChange,
  tabLayoutId = 'public-filter-tab',
  sortValue,
  onSortChange,
  sortOptions,
  filterGroups,
  activeFilterCount = 0,
  onResetFilters,
  drawerTriggerLabel = 'Filter',
  actions,
  className = '',
}: PublicFilterToolbarProps) {
  // Format tabs items agar kompatibel dengan PillTabs
  const normalizedTabs = React.useMemo(() => {
    if (!tabs) return [];
    return tabs.map((t) => {
      if (typeof t === 'string') return { key: t, label: t };
      return t;
    });
  }, [tabs]);

  const hasSearch = typeof onSearchChange === 'function';
  const hasTabs = normalizedTabs.length > 0 && typeof onTabChange === 'function' && activeTab !== undefined;
  const hasSort = sortOptions && sortOptions.length > 0 && typeof onSortChange === 'function';
  const hasDrawer = filterGroups && filterGroups.length > 0;

  return (
    <div className={`w-full flex flex-col gap-3.5 mb-6 ${className}`}>
      {/* ─── BARIS 1: SEARCH BAR + SORT + DRAWER TRIGGER (Responsive Grid) ─── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Search Input dengan Borderless Clean Style */}
        {hasSearch && (
          <div className="relative flex-1 min-w-[240px] sm:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-11 sm:h-12 pl-10 pr-9 rounded-2xl bg-white border border-slate-200/90 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Action Controls: Drawer Filter (Mobile), Sort Dropdown, & Extra Actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Tombol Filter Drawer (Khusus Mobile jika ada filterGroups) */}
          {hasDrawer && (
            <FilterDrawer
              groups={filterGroups}
              activeCount={activeFilterCount}
              onResetAll={onResetFilters}
              triggerLabel={drawerTriggerLabel}
            />
          )}

          {/* Sort Dropdown Minimalis */}
          {hasSort && (
            <div className="relative inline-flex items-center">
              <div className="flex items-center h-11 sm:h-12 px-3 sm:px-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
                <ArrowUpDown size={14} className="text-slate-500 mr-2 shrink-0 pointer-events-none" />
                <select
                  value={sortValue}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-slate-700 outline-none pr-2 cursor-pointer"
                  aria-label="Urutkan berdasarkan"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Extra Actions Slot (misal tombol reset cepat) */}
          {actions}
        </div>
      </div>

      {/* ─── BARIS 2: PILL TABS KATEGORI (Scrollable Horizontal) ─── */}
      {hasTabs && (
        <div className="w-full overflow-hidden">
          <PillTabs
            tabs={normalizedTabs}
            active={activeTab}
            onChange={onTabChange}
            layoutId={tabLayoutId}
            ariaLabel="Pilih Kategori"
          />
        </div>
      )}
    </div>
  );
}

export default PublicFilterToolbar;

