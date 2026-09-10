// Lokasi file: src/app/(public)/ekosistem/page.tsx

import ClientPage from './ClientPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sintesa.solotechnopark.id';

export default function EkosistemPage() {
  // Format JSON-LD untuk Halaman Direktori Bisnis/Startup
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Katalog Ekosistem Startup & Inovasi KST Solo Technopark',
    description: 'Direktori lengkap startup, UMKM, dan mitra industri yang bernaung di ekosistem Solo Technopark.',
    url: `${APP_URL}/ekosistem`,
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
      
      {/* Panggil UI Client yang sudah Anda buat */}
      <ClientPage />
    </>
  );
}