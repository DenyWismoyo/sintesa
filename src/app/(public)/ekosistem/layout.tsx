// Lokasi file: src/app/(public)/ekosistem/layout.tsx

import { Metadata } from 'next';
import React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const metadata: Metadata = {
  title: 'Katalog Ekosistem Startup & Inovasi | KST Solo Technopark',
  description: 'Eksplorasi direktori lengkap startup, teknologi, UMKM, dan inovator yang berkembang di kawasan ekosistem Solo Technopark.',
  openGraph: {
    title: 'Katalog Ekosistem Inovasi | KST Solo Technopark',
    description: 'Eksplorasi startup, teknologi, UMKM, dan inovator di Solo Technopark.',
    url: `${APP_URL}/ekosistem`,
    siteName: 'Solo Technopark',
    images: [
      {
        // Siapkan banner khusus ekosistem ukuran 1200x630
        url: `${APP_URL}/images/ekosistem-banner-og.jpg`, 
        width: 1200,
        height: 630,
        alt: 'Banner Ekosistem Solo Technopark'
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ekosistem Inovasi | KST Solo Technopark',
    description: 'Eksplorasi startup, teknologi, UMKM, dan inovator di Solo Technopark.',
    images: [`${APP_URL}/images/ekosistem-banner-og.jpg`],
  },
  alternates: {
    canonical: `${APP_URL}/ekosistem`,
  }
};

export default function EkosistemLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}