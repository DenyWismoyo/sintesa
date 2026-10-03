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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-emerald-500/20" />
          <p className="text-sm text-slate-400 font-medium tracking-wide">
            Memverifikasi Sesi Techno Sign STP...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <NetworkSentinel />
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
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
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="TechnoSign" />
        </head>
        <PresensiShell>{children}</PresensiShell>
      </PresensiAuthProvider>
    </QueryClientProvider>
  );
}
