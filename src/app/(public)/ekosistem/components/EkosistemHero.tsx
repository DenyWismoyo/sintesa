// Lokasi: src/app/(public)/ekosistem/components/EkosistemHero.tsx
'use client';

import React from 'react';
import { Users, PlusCircle } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';

export type EkosistemView = 'DIRECTORY' | 'HUB';

interface EkosistemHeroProps {
  activeView: EkosistemView;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  isLoading?: boolean;
  onOpenCreateThread?: () => void;
}

export default function EkosistemHero({
  activeView,
  searchQuery,
  onSearchChange,
  isLoading = false,
  onOpenCreateThread,
}: EkosistemHeroProps) {
  return (
    <PageHero
      breadcrumbs={[{ label: 'Ekosistem', href: '/ekosistem' }]}
      badge={{ label: 'Ekosistem Terpadu Pentahelix', icon: <Users size={13} />, variant: 'purple' }}
      title="KST Smart Hub & Ekosistem"
      subtitle="Platform kolaborasi pentahelix. Temukan startup binaan potensial, jalin kemitraan industri strategis, atau sampaikan tawaran riset kampus dalam satu jejaring inovatif."
      accentColor="indigo"
      searchValue={activeView === 'DIRECTORY' ? searchQuery : undefined}
      onSearchChange={activeView === 'DIRECTORY' ? onSearchChange : undefined}
      searchPlaceholder="Cari startup, inovasi, teknologi..."
      isLoadingSearch={isLoading}
      actions={
        activeView === 'HUB' && onOpenCreateThread ? (
          <Button
            onClick={onOpenCreateThread}
            className="h-10 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <PlusCircle size={15} />
            <span>Mulai Diskusi</span>
          </Button>
        ) : undefined
      }
    />
  );
}

