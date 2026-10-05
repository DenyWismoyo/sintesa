// src/app/(presensi)/presensi/manifest.webmanifest/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    name: "Techno Sign - Solo Technopark",
    short_name: "Techno Sign",
    description: "Sistem Presensi Digital & Kinerja Harian UPTD Kawasan Sains dan Teknologi Solo Technopark",
    start_url: "/presensi",
    scope: "/presensi",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/presensi/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/presensi/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/presensi/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/presensi/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icons/presensi/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Presensi Swafoto",
        short_name: "Scan",
        description: "Buka kamera swafoto kehadiran real-time",
        url: "/presensi/scan",
        icons: [{ src: "/icons/presensi/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Logbook Kinerja LKH",
        short_name: "LKH",
        description: "Isi laporan kegiatan harian pegawai",
        url: "/presensi/laporan",
        icons: [{ src: "/icons/presensi/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Pengajuan Cuti / Izin",
        short_name: "Izin",
        description: "Formulir izin dinas, sakit, dan cuti",
        url: "/presensi/izin",
        icons: [{ src: "/icons/presensi/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
    },
  });
}
