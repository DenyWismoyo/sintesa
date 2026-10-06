// src/app/(public)/karir/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import KarirClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Bursa Karir & Talenta Alumni | Solo Technopark',
  description:
    'Pusat informasi lowongan pekerjaan dan penyaluran karir resmi bagi alumni program pelatihan Solo Technopark bersama mitra industri terkemuka.',
  keywords: [
    'Lowongan Kerja Solo Technopark',
    'Karir Alumni STP',
    'Penyaluran Kerja Solo',
    'Magang Solo Technopark',
    'Loker IT Solo',
    'Loker CNC Manufaktur',
    'Loker AI Data Science',
  ],
  openGraph: {
    title: 'Bursa Karir & Talenta Alumni Solo Technopark',
    description:
      'Jembatan karir resmi antara alumni pelatihan Solo Technopark dengan mitra industri kawasan, startup inkubasi, dan perusahaan nasional.',
    url: 'https://solotechnopark.id/karir',
    siteName: 'Solo Technopark',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function KarirPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KarirClientPage />
    </Suspense>
  );
}
