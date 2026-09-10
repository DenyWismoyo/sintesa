// Lokasi file: src/app/(public)/fasilitas/layout.tsx

import { Metadata } from 'next';
import React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sintesa.solotechnopark.id';

export const metadata: Metadata = {
  title: 'Sewa Ruangan & Fasilitas | KST Solo Technopark',
  description: 'Temukan dan pesan ruang meeting, auditorium, atau fasilitas kelas dunia untuk menunjang aktivitas Anda di kawasan Solo Technopark.',
  openGraph: {
    title: 'Sewa Ruangan & Fasilitas | KST Solo Technopark',
    description: 'Temukan dan pesan ruang meeting, auditorium, atau fasilitas kelas dunia.',
    url: `${APP_URL}/fasilitas`,
    siteName: 'Solo Technopark',
    images: [
      {
        // Siapkan gambar ukuran 1200x630 di folder public Anda
        url: `${APP_URL}/images/fasilitas-banner-og.jpg`, 
        width: 1200,
        height: 630,
        alt: 'Banner Fasilitas Solo Technopark'
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sewa Ruangan & Fasilitas | KST Solo Technopark',
    description: 'Temukan dan pesan ruang meeting, auditorium, atau fasilitas kelas dunia.',
    images: [`${APP_URL}/images/fasilitas-banner-og.jpg`],
  },
  alternates: {
    canonical: `${APP_URL}/fasilitas`,
  }
};

export default function FasilitasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}