// Lokasi file: src/components/common/CookieConsentBanner.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, Check, X, Info } from 'lucide-react';
import { getCookieConsent, setCookieConsent } from '@/lib/cookies';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Periksa status consent yang tersimpan
    const consent = getCookieConsent();
    if (!consent) {
      // Tampilkan banner dengan delay halus 800ms agar halaman siap terlebih dahulu
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookieConsent('all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    setCookieConsent('essential');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-md w-auto"
          role="region"
          aria-label="Pemberitahuan Persetujuan Cookie"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 p-4 sm:p-5 text-slate-800 ring-1 ring-black/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                <Cookie size={19} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Privasi & Penggunaan Cookie
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    UU PDP
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Solo Technopark menggunakan cookie esensial untuk keamanan sesi serta cookie analitik untuk meningkatkan kenyamanan penelusuran layanan kawasan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Tutup (Hanya Esensial)"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Rincian Dropdown (Collapsible) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-600" /> Cookie Esensial (Wajib)
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">Selalu Aktif</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Token sesi aman (<code className="font-mono bg-white px-1 rounded">__session</code>) untuk otentikasi login Edge Runtime & proteksi transaksi.
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Info size={13} className="text-sky-600" /> Preferensi & Afiliasi Mitra
                        </span>
                        <span className="text-[10px] text-sky-600 font-bold">Opsional</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Menyimpan kode referral mitra (<code className="font-mono bg-white px-1 rounded">sintesa_ref</code>) selama 30 hari untuk atribusi komisi kemitraan.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tombol Aksi */}
            <div className="mt-3.5 pt-3 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer py-1"
              >
                {showDetails ? (
                  <>Sembunyikan Rincian <ChevronUp size={12} /></>
                ) : (
                  <>Lihat Rincian <ChevronDown size={12} /></>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  Hanya Esensial
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Check size={13} />
                  Setujui Semua
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
