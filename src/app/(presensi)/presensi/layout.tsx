// src/app/(presensi)/presensi/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PresensiAuthProvider, usePresensiAuth } from "@/lib/presensi/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/presensi/dashboard/Sidebar";
import Header from "@/components/presensi/dashboard/Header";
import BottomNav from "@/components/presensi/dashboard/BottomNav";
import NetworkSentinel from "@/components/presensi/dashboard/NetworkSentinel";
import TechnoSignLogo from "@/components/presensi/TechnoSignLogo";

function PresensiShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = usePresensiAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/presensi/login";

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.replace("/presensi/login");
    }
  }, [isLoading, user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-slate-800 relative overflow-hidden">
        <div className="public-glow-emerald" />
        <div className="public-bg-dots" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <TechnoSignLogo size="xl" variant="icon-only" withGlow className="animate-pulse" />
            <div className="absolute -inset-2 border-2 border-emerald-600/30 border-t-emerald-600 rounded-2xl animate-spin pointer-events-none" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-extrabold text-slate-900 tracking-tight">
              Techno <span className="text-emerald-600">Sign</span>
            </p>
            <p className="text-xs text-slate-500 font-medium">Memverifikasi identitas & sesi pegawai...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-emerald-600 selection:text-white relative">
      {/* Background ambient pattern khas katalog Solo Technopark */}
      <div className="public-bg-dots fixed inset-0 pointer-events-none opacity-40" />
      <div className="public-glow-emerald fixed top-0 pointer-events-none opacity-50" />

      {/* Desktop Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <NetworkSentinel />
        <Header />
        <main className="flex-1 px-0 py-0 sm:px-6 sm:py-6 lg:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto space-y-3 sm:space-y-6">
          {children}
        </main>
        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function PresensiRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 3, // 3 menit
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PresensiAuthProvider>
        <head>
          <link rel="manifest" href="/presensi/manifest.webmanifest" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/presensi/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/icons/presensi/icon-192x192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/icons/presensi/icon-512x512.png" />
          <link rel="icon" type="image/svg+xml" href="/icons/presensi/icon.svg" />
          <meta name="theme-color" content="#059669" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Techno Sign" />
        </head>
        <PresensiShell>{children}</PresensiShell>
      </PresensiAuthProvider>
    </QueryClientProvider>
  );
}
