// Lokasi file: src/app/(public)/program-pelatihan/page.tsx

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
    itemListElement: [
      // Dalam implementasi nyata, Anda bisa mem-fetch beberapa top courses di sini, 
      // namun sebagai halaman index, minimal kita memberikan gambaran kepada Google
      // bahwa ini adalah direktori kursus (Course Provider)
    ],
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
      
      {/* Panggil UI Client yang kompleks di sini */}
      <ClientPage />
    </>
  );
}