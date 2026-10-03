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
        src: "/favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon",
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
