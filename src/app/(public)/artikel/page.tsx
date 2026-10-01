import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ArtikelListClient from './ClientPage';

export const metadata: Metadata = {
  title: 'Warta, Berita & Panduan Edukasi | Solo Technopark',
  description: 'Temukan ulasan mendalam seputar program pelatihan kerja, fasilitas riset, warta inovasi, dan profil tenant Solo Technopark untuk membantu Anda menentukan keputusan terbaik.',
  openGraph: {
    title: 'Warta, Berita & Panduan Edukasi | Solo Technopark',
    description: 'Pelajari kurikulum, prospek karir pelatihan, serta berita ekosistem teknologi terkini di Solo Technopark.',
    images: [{ url: '/logo.png', width: 800, height: 600, alt: 'Solo Technopark' }],
  },
};

export default function ArtikelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ArtikelListClient />
    </Suspense>
  );
}
