'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error untuk monitoring debugging
    console.error('[ADMIN ERROR BOUNDARY]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
      </div>

      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 mb-3">
        Gangguan Sistem Panel Admin
      </span>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        Terjadi Kesalahan Saat Memuat Halaman
      </h2>

      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        Modul yang Anda buka mengalami kendala sementara saat memproses data. Silakan coba muat ulang atau kembali ke dashboard utama.
      </p>

      {error.digest && (
        <p className="text-xs text-slate-400 font-mono mb-6 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          Kode Diagnosa: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <LayoutDashboard className="w-4 h-4" />
          Ke Dashboard
        </Link>
      </div>
    </div>
  );
}
