'use client';

import React from 'react';
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
  totalResults?: number;
}

export default function TenantFilters({
  activeSegment,
  onSegmentChange,
  totalResults
}: TenantFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <PillTabs
        tabs={SEGMENTS.map((s) => ({ key: s.id, label: s.label }))}
        active={activeSegment}
        onChange={onSegmentChange}
        layoutId="tenant-segment-pills"
        ariaLabel="Filter Segmen Tenant"
      />
      {typeof totalResults === 'number' && (
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
          {totalResults} Entitas Terdaftar
        </span>
      )}
    </div>
  );
}

