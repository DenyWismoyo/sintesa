// Lokasi file: src/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Katalog Solo Technopark',
    short_name: 'Katalog STP',
    description: 'Katalog resmi layanan fasilitas, produk inovasi, program pelatihan vokasi, dan ekosistem bisnis Solo Technopark.',
    start_url: '/',
    scope: '/',
    display: 'standalone', // Tampil full-screen seperti aplikasi native
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/katalog/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/katalog/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/katalog/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/katalog/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/katalog/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      // Fallback ke root icon jika browser mencari di root path
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Katalog Produk Inovasi',
        short_name: 'E-Katalog',
        description: 'Jelajahi produk inovasi dan tenant riset Solo Technopark',
        url: '/e-katalog',
        icons: [{ src: '/icons/katalog/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Sewa Fasilitas & Ruangan',
        short_name: 'Fasilitas',
        description: 'Pemesanan ruangan, aula, dan lab Solo Technopark',
        url: '/fasilitas',
        icons: [{ src: '/icons/katalog/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Program Pelatihan Vokasi',
        short_name: 'Pelatihan',
        description: 'Daftar akademi diklat dan sertifikasi industri',
        url: '/program-pelatihan',
        icons: [{ src: '/icons/katalog/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Bursa Karir & Talenta',
        short_name: 'Karir',
        description: 'Peluang karir dan rekrutmen mitra industri STP',
        url: '/karir',
        icons: [{ src: '/icons/katalog/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}