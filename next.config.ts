// Lokasi file: next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// --- KONFIGURASI PWA KATALOG (scope: /, exclude presensi) ---
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // ─── PENTING: Exclude rute /presensi/* dari SW katalog ───────────
    navigateFallbackDenylist: [/^\/presensi/],
    exclude: [/presensi/, /sw-presensi\.js/],
  },
});

// --- CONTENT SECURITY POLICY (CSP) & SECURITY HEADERS (HARDENING FORTIS ID) ---
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://via.placeholder.com https://placehold.co https://ui-avatars.com https://lh3.googleusercontent.com https://*.tile.openstreetmap.org;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.cloudfunctions.net https://clario-api.fly.dev wss://*.firebaseio.com https://katalog.solotechnopark.id https://*.tile.openstreetmap.org;
  frame-src 'self' https://*.firebaseapp.com;
  frame-ancestors 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  // 1. HTTP Strict Transport Security (HSTS) - Mengunci koneksi selalu HTTPS 1 tahun (Scan Medium #1)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // 2. Proteksi Clickjacking / UI Redressing (Scan Low #4)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // 3. Mencegah MIME Type Sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. Mencegah kebocoran URL referer ke pihak ketiga (Scan Best Practice #6)
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 5. Pembatasan akses hardware (Presensi butuh kamera & geolocation mandiri)
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(self)',
  },
  // 6. Optimasi DNS prefetching yang aman
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // 7. Content Security Policy Terpadu (Scan Best Practice #5)
  {
    key: 'Content-Security-Policy',
    value: cspHeader,
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Matikan header x-powered-by: Next.js untuk mencegah fingerprinting framework (Scan Info #14)
  poweredByHeader: false,
  
  turbopack: {},
  
  // Daftarkan header keamanan untuk seluruh rute aplikasi
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
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
