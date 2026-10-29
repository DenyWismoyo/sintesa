// src/app/(public)/alumni-portal/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import AlumniPortalClientPage from './ClientPage';

export const metadata: Metadata = {
  title: 'Forum Eksklusif Alumni STP × RSKB Surakarta | Solo Technopark',
  description:
    'Ruang kolaborasi dua zona bagi Alumni Vokasi Solo Technopark, Rumah Siap Kerja Bersama (RSKB) Kota Surakarta, Mitra Industri Resmi, dan Startup Tenant.',
};

export default function AlumniPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AlumniPortalClientPage />
    </Suspense>
  );
}

