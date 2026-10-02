// Lokasi: src/components/common/FloatingAIButton.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Bot, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingAIButton() {
  const pathname = usePathname();
  const [isDismissed, setIsDismissed] = useState(false);

  // Jangan tampilkan jika pengguna sudah berada di halaman /explore (AI Assistant itu sendiri)
  if (pathname === '/explore') {
    return null;
  }

  return (
    <aside 
      aria-label="Asisten AI Kawasan" 
      className="fixed bottom-5 right-5 z-40 flex items-end gap-2.5 pointer-events-auto select-none"
    >
      {/* Tooltip Dialog Mini (Dapat di-dismiss sementara) */}
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="hidden sm:flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-xl text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Link 
              href="/explore" 
              className="hover:text-blue-300 transition-colors flex items-center gap-1.5"
            >
              <span>Butuh panduan kawasan? <strong>Tanya Krenova AI</strong></span>
              <ArrowRight size={13} className="text-blue-400" />
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Tutup pesan"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <Link
        href="/explore"
        aria-label="Buka Asisten AI Krenova Solo Technopark"
        className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
      >
        {/* Glow pulsing ring */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 opacity-30 group-hover:opacity-60 blur-sm group-hover:blur-md transition-all -z-10 animate-pulse" />

        {/* Icon Bot + Sparkles */}
        <div className="relative">
          <Bot size={24} className="group-hover:rotate-6 transition-transform" />
          <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-300 animate-bounce" />
        </div>

        {/* Badge status AI Online */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
      </Link>
    </aside>
  );
}
