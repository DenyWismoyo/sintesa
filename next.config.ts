// Lokasi file: next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// --- KONFIGURASI PWA KATALOG (scope: /, exclude presensi) ---
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Catatan: swcMinify jangan ditulis lagi di sini
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // ─── PENTING: Exclude rute /presensi/* dari SW katalog ───────────
    // Rute presensi ditangani oleh sw-presensi.js dengan scope sendiri
    navigateFallbackDenylist: [/^\/presensi/],
    // Exclude file-file presensi dari pre-caching
    exclude: [/presensi/, /sw-presensi\.js/],
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // --- PERBAIKAN ERROR TURBOPACK ---
  // Konfigurasi ini memberi tahu Next.js untuk mengabaikan bentrok 
  // antara Webpack (milik PWA) dan Turbopack bawaan Next.js 15+
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com', 
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', 
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);