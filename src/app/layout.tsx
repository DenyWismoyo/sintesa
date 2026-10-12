// Lokasi file: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from '@/lib/QueryProvider';
import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from 'sonner';
import { LoginModalProvider } from "@/context/LoginModalContext";
import LoginModal from "@/components/auth/LoginModal";

const inter = Inter({ subsets: ["latin"] });

// --- KONFIGURASI VIEWPORT (Khusus Next.js 14+) ---
export const viewport: Viewport = {
  themeColor: "#ffffff", // Warna header aplikasi (Clean White)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom berlebih saat diinstal sebagai App
};

// --- KONFIGURASI METADATA & PWA APPLE ---
export const metadata: Metadata = {
  title: "Katalog Solo Technopark | Jembatan Katalog & Layanan Kawasan",
  description: "Katalog resmi layanan, fasilitas, pelatihan, dan produk inovasi Solo Technopark. Bagian terintegrasi dari ekosistem solotechnopark.id",
  generator: "Next.js",
  applicationName: "Katalog Solo Technopark",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Katalog STP",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/katalog/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/katalog/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/icons/katalog/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        {/* PWA Manifest & Icons Resmi Katalog Solo Technopark */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/katalog/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/katalog/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/katalog/icon-512x512.png" />
      </head>
      {/* Menerapkan font Inter ke tag body */}
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <LoginModalProvider>
              {children}
              <LoginModal />
              <Toaster position="top-center" richColors />
            </LoginModalProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}