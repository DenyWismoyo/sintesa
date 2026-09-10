// Lokasi file: src/app/(public)/fasilitas/page.tsx

import ClientPage from './ClientPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sintesa.solotechnopark.id';

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
      
      {/* Render logika Client (UI, Filter, dll) */}
      <ClientPage />
    </>
  );
}