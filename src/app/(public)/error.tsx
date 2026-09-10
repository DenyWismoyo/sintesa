'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[PUBLIC ERROR BOUNDARY]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-blue-600 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
        Halaman Sedang Mengalami Kendala
      </h1>

      <p className="text-sm sm:text-base text-slate-600 max-w-lg mb-8 leading-relaxed">
        Mohon maaf atas ketidaknyamanannya. Kami sedang memperbarui layanan ini. Silakan coba muat ulang halaman atau kembali ke beranda.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Muat Ulang Halaman
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
