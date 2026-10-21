// src/app/(presensi)/layout.tsx
// Server Component — Override metadata PWA untuk seluruh route group presensi
// Ini memastikan browser membaca manifest Techno Sign, bukan manifest Katalog

import type { Metadata, Viewport } from "next";

// ─── OVERRIDE VIEWPORT untuk presensi ───────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#059669", // Emerald — khas Techno Sign
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ─── OVERRIDE METADATA untuk presensi ───────────────────────────────────────
export const metadata: Metadata = {
  title: "Techno Sign — Presensi Digital Solo Technopark",
  description:
    "Sistem presensi digital dan manajemen kinerja harian pegawai UPTD Kawasan Sains dan Teknologi Solo Technopark.",
  applicationName: "Techno Sign",
  // Manifest khusus Techno Sign — menimpa manifest Katalog dari root layout
  manifest: "/presensi/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Techno Sign",
  },
  icons: {
    icon: [
      {
        url: "/icons/presensi/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/presensi/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      { url: "/favicon.ico" },
    ],
    apple: [
      {
        url: "/icons/presensi/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/presensi/icon.svg",
        // @ts-ignore — color attribute non-standard tapi didukung Safari
        color: "#059669",
      },
    ],
  },
  formatDetection: { telephone: false },
};

// Layout ini hanya meneruskan children — HTML/body sudah dihandle oleh root layout.
// Tujuannya HANYA meng-override metadata segment untuk route group ini.
export default function PresensiGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
