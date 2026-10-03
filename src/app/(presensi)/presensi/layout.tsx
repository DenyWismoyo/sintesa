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
        <div className="relative z-10 text-center space-y-4">
          <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto shadow-md shadow-emerald-600/10" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 tracking-tight">Techno Sign</p>
            <p className="text-xs text-slate-500 font-medium">Memverifikasi sesi pegawai...</p>
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto space-y-6">
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
          <meta name="theme-color" content="#059669" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Techno Sign" />
        </head>
        <PresensiShell>{children}</PresensiShell>
      </PresensiAuthProvider>
    </QueryClientProvider>
  );
}
