// Lokasi file: src/app/(public)/fasilitas/page.tsx

import React, { Suspense } from 'react';
import ClientPage from './ClientPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export default function FasilitasPage() {
  // Format JSON-LD untuk Halaman Direktori / Katalog
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Sewa Ruangan & Fasilitas KST Solo Technopark',
    description: 'Katalog ruang meeting, auditorium, dan fasilitas kelas dunia yang dapat disewa di Solo Technopark.',
    url: `${APP_URL}/fasilitas`,
    publisher: {
      '@type': 'Organization',
      name: 'Solo Technopark',
      url: APP_URL
    }
  };

  return (
    <>
      {/* Inject JSON-LD Script ke Head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Render logika Client di dalam Suspense boundary */}
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        </div>
      }>
        <ClientPage />
      </Suspense>
    </>
  );
}