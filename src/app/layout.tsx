// Lokasi file: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from '@/lib/QueryProvider';
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

// --- KONFIGURASI VIEWPORT (Khusus Next.js 14+) ---
export const viewport: Viewport = {
  themeColor: "#0f172a", // Warna header aplikasi (Slate 900)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom berlebih saat diinstal sebagai App
};

// --- KONFIGURASI METADATA & PWA APPLE ---
export const metadata: Metadata = {
  title: "SINTESA | Solo Technopark",
  description: "Sistem Integrasi Technopark Surakarta - Manajemen Aset & Layanan",
  generator: "Next.js",
  applicationName: "SINTESA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SINTESA",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
         {/* Apple Touch Icon - Diperlukan khusus untuk perangkat iOS */}
         <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      {/* Menerapkan font Inter ke tag body */}
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}