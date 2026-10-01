// Lokasi file: src/app/(public)/e-katalog/layout.tsx

import { Metadata } from 'next';
import React from 'react';

// Telah disesuaikan dengan domain produksi Anda
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

// FASE 4: Menyematkan Meta Global di Layout agar halaman list (/e-katalog) terindeks
export const metadata: Metadata = {
  title: 'E-Katalog | Inovasi & Layanan KST Solo Technopark',
  description: 'Jelajahi berbagai fasilitas eksklusif, produk teknologi terapan, dan layanan profesional yang tersedia di kawasan Solo Technopark.',
  openGraph: {
    title: 'E-Katalog KST Solo Technopark',
    description: 'Jelajahi berbagai fasilitas eksklusif, produk teknologi terapan, dan layanan profesional.',
    url: `${APP_URL}/e-katalog`,
    siteName: 'Solo Technopark',
    images: [
      {
        url: `${APP_URL}/images/katalog-banner-og.jpg`, 
        width: 1200,
        height: 630,
        alt: 'Banner E-Katalog Solo Technopark'
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Katalog KST Solo Technopark',
    description: 'Jelajahi berbagai fasilitas eksklusif, produk teknologi terapan, dan layanan profesional.',
    images: [`${APP_URL}/images/katalog-banner-og.jpg`],
  },
  alternates: {
    canonical: `${APP_URL}/e-katalog`,
  }
};

export default function KatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}