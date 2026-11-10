// Lokasi file: src/app/(public)/program-pelatihan/page.tsx

import React, { Suspense } from 'react';
import ClientPage from './ClientPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export default function ProgramPelatihanPage() {
  // Format JSON-LD untuk Koleksi Kursus
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Katalog Program Pelatihan KST Solo Technopark',
    description: 'Daftar program pelatihan, sertifikasi, dan bootcamp.',
    url: `${APP_URL}/program-pelatihan`,
    itemListElement: [],
    mainEntity: {
      '@type': 'EducationalOrganization',
      name: 'KST Solo Technopark',
      url: APP_URL
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Panggil UI Client di dalam Suspense boundary */}
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }>
        <ClientPage />
      </Suspense>
    </>
  );
}