// Lokasi file: src/app/(public)/program-pelatihan/layout.tsx

import { Metadata } from 'next';
import React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

// FASE 4: Menyematkan Meta Global di Layout agar halaman list (/program-pelatihan) terindeks optimal
export const metadata: Metadata = {
  title: 'Program Pelatihan & Sertifikasi | KST Solo Technopark',
  description: 'Ikuti berbagai program pelatihan intensif, bootcamp, dan sertifikasi untuk meningkatkan keahlian Anda bersama instruktur profesional dan tersertifikasi di Solo Technopark.',
  openGraph: {
    title: 'Program Pelatihan & Sertifikasi | KST Solo Technopark',
    description: 'Tingkatkan skill Anda dengan pelatihan berbasis industri, instruktur ahli, dan fasilitas lengkap.',
    url: `${APP_URL}/program-pelatihan`,
    siteName: 'Solo Technopark',
    images: [
      {
        url: `${APP_URL}/images/pelatihan-banner-og.jpg`, // Pastikan menyiapkan gambar ini (1200x630)
        width: 1200,
        height: 630,
        alt: 'Banner Program Pelatihan Solo Technopark'
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Program Pelatihan | KST Solo Technopark',
    description: 'Tingkatkan skill Anda dengan pelatihan berbasis industri.',
    images: [`${APP_URL}/images/pelatihan-banner-og.jpg`],
  },
  alternates: {
    canonical: `${APP_URL}/program-pelatihan`,
  }
};

export default function PelatihanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}