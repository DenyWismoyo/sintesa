// Lokasi file: src/app/(public)/layout.tsx
'use client';

import React, { Suspense } from 'react';
import PublicNavbar from '@/components/common/PublicNavbar';
import PublicFooter from '@/components/common/PublicFooter';
import WhatsAppFloatingConcierge from '@/components/common/WhatsAppFloatingConcierge';
import { AffiliateTracker } from '@/components/common/AffiliateTracker';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* --- PUBLIC NAVBAR TERPADU (IDENTIK DI SEMUA HALAMAN & MOBILE) --- */}
      <PublicNavbar />

      {/* --- MAIN CONTENT AREA DENGAN PADDING ERGONOMIS TANPA OVERLAP DENGAN FIXED NAVBAR --- */}
      <main className="flex-1 w-full flex flex-col relative z-10 pt-[4.25rem] sm:pt-20 pb-8 sm:pb-12">
        <Suspense fallback={null}>
          <AffiliateTracker />
        </Suspense>
        {children}
      </main>

      {/* --- WHATSAPP FLOATING CONCIERGE (ANTI-COLLISION DENGAN STICKY BAR & FOOTER) --- */}
      <WhatsAppFloatingConcierge />

      {/* --- PUBLIC FOOTER TERPADU DENGAN IDENTITAS BLUD & KONTAK RESMI --- */}
      <PublicFooter />
    </div>
  );
}