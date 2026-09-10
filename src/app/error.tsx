'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error('[ROOT APPLICATION ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mx-auto mb-4 border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kesalahan Aplikasi</h1>
        <p className="text-sm text-slate-500 mb-6">
          Aplikasi menemukan error tak terduga. Silakan muat ulang peramban Anda.
        </p>
        <button
          onClick={() => reset()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
      </div>
    </div>
  );
}
