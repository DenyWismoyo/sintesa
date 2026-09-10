'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import PillTabs from '@/components/ui/PillTabs';

export const SEGMENTS = [
  { id: 'Semua', label: 'Semua Segmen' },
  { id: 'StartUp', label: 'StartUp Teknologi' },
  { id: 'UMKM', label: 'UMKM / IKM' },
  { id: 'Koperasi', label: 'Koperasi' },
  { id: 'Kampus', label: 'Perguruan Tinggi' },
  { id: 'Industri', label: 'Mitra Industri' }
];

interface TenantFiltersProps {
  activeSegment: string;
  onSegmentChange: (segmentId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResults?: number;
}

export default function TenantFilters({
  activeSegment,
  onSegmentChange,
  searchQuery,
  onSearchChange,
  totalResults
}: TenantFiltersProps) {
  return (
    <div className="w-full py-3 px-4 sm:px-6 lg:px-10 bg-white/80 backdrop-blur-md sticky top-16 sm:top-20 z-30 shadow-xs">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search Bar Input */}
        <div className="public-search-bar flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari startup, teknologi, inovasi..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="public-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
              title="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Segments Pill Tabs */}
        <div className="flex items-center gap-2">
          <PillTabs
            tabs={SEGMENTS.map((s) => ({ key: s.id, label: s.label }))}
            active={activeSegment}
            onChange={onSegmentChange}
            layoutId="tenant-segment-pills"
            ariaLabel="Filter Segmen Tenant"
          />
        </div>

      </div>
    </div>
  );
}
