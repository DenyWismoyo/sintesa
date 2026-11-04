// Lokasi file: src/app/(public)/review-pelatihan/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ReviewPelatihanClientPage from './ClientPage';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Review & Evaluasi Program Pelatihan Vokasi | Solo Technopark',
  description: 'Portal ulasan terbuka dan evaluasi mutu program pelatihan vokasi Solo Technopark, termasuk program SMK Go Global BP3MI Jawa Tengah. Terbuka untuk peserta, mentor, dan industri tanpa login.',
  openGraph: {
    title: 'Review & Evaluasi Program Pelatihan | Solo Technopark',
    description: 'Suara nyata dari peserta, mentor, dan industri mitra untuk transparansi dan mutu pelatihan vokasi Solo Technopark.',
  },
};

export default function ReviewPelatihanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="font-bold text-slate-600 text-sm">Memuat portal review pelatihan...</p>
        </div>
      }
    >
      <ReviewPelatihanClientPage />
    </Suspense>
  );
}

