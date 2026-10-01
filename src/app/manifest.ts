// Lokasi file: src/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Katalog Solo Technopark',
    short_name: 'Katalog STP',
    description: 'Katalog resmi layanan, fasilitas, pelatihan, dan produk inovasi Solo Technopark',
    start_url: '/',
    display: 'standalone', // Membuatnya tampil full-screen seperti aplikasi native
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  };
}