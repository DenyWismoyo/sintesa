// src/app/(public)/kemitraan/page.tsx
import { Metadata } from 'next';
import ClientPage from './ClientPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const metadata: Metadata = {
  title: 'Kemitraan Strategis & Kolaborasi Industri | Solo Technopark',
  description:
    'Gerbang sinergi kemitraan B2B dan B2G Solo Technopark: sewa fasilitas kawasan MICE, pemanfaatan lab manufaktur presisi, rekrutmen talenta teknologi, dan program CSR inkubasi startup.',
  openGraph: {
    title: 'Kemitraan Industri & B2B Hub | Solo Technopark',
    description:
      'Solusi kemitraan strategis berstandar kelas dunia bersama UPT Solo Technopark.',
    url: `${APP_URL}/kemitraan`,
    siteName: 'Solo Technopark',
    locale: 'id_ID',
    type: 'website',
  },
  alternates: {
    canonical: `${APP_URL}/kemitraan`,
  },
};

export default function KemitraanPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Kemitraan Strategis Industri & B2B Solo Technopark',
    description:
      'Layanan kemitraan B2B Solo Technopark untuk korporasi, kementerian, BUMN, dan perguruan tinggi.',
    url: `${APP_URL}/kemitraan`,
    publisher: {
      '@type': 'Organization',
      name: 'Solo Technopark',
      url: APP_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClientPage />
    </>
  );
}
