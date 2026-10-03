// Lokasi file: src/components/common/WhatsAppFloatingConcierge.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Nomor WhatsApp Resmi Layanan Publik Solo Technopark (Bisa di-override via env)
const WA_PHONE_NUMBER = process.env.NEXT_PUBLIC_WA_SUPPORT_NUMBER || '628112658883';

export default function WhatsAppFloatingConcierge() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Jangan tampilkan di halaman admin atau portal internal
  const isExcludedRoute = pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/super-admin') || 
                          pathname?.startsWith('/login') ||
                          pathname?.startsWith('/ruang-belajar/');

  // Cek apakah halaman saat ini memiliki Mobile Sticky Action Bar di bagian bawah
  // (misal halaman detail produk, detail fasilitas, detail pelatihan)
  const isDetailPageWithStickyBar = 
    (pathname?.startsWith('/e-katalog/') && pathname !== '/e-katalog') ||
    (pathname?.startsWith('/fasilitas/') && pathname !== '/fasilitas') ||
    (pathname?.startsWith('/program-pelatihan/') && pathname !== '/program-pelatihan');

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isExcludedRoute) return null;

  // Dapatkan pesan kontekstual pintar sesuai halaman yang sedang dibuka
  const getContextualMessage = () => {
    if (pathname?.includes('/fasilitas')) {
      return 'Halo Admin Solo Technopark, saya ingin menanyakan jadwal ketersediaan dan prosedur sewa fasilitas ruangan di kawasan.';
    }
    if (pathname?.includes('/e-katalog')) {
      return 'Halo Admin Solo Technopark, saya tertarik dengan produk/layanan di E-Katalog dan ingin konsultasi lebih lanjut.';
    }
    if (pathname?.includes('/program-pelatihan')) {
      return 'Halo Tim Solo Technopark, saya ingin bertanya seputar pendaftaran dan sertifikasi program pelatihan.';
    }
    if (pathname?.includes('/event')) {
      return 'Halo Admin Solo Technopark, saya ingin menanyakan informasi seputar agenda acara/event di kawasan.';
    }
    if (pathname?.includes('/artikel')) {
      return 'Halo Redaksi Solo Technopark, saya ingin bertanya terkait warta dan inovasi yang dipublikasikan.';
    }
    return 'Halo Admin Solo Technopark, saya membutuhkan informasi seputar layanan Kawasan Sains & Teknologi.';
  };

  const handleOpenWhatsApp = () => {
    const message = encodeURIComponent(getContextualMessage());
    const waUrl = `https://wa.me/${WA_PHONE_NUMBER}?text=${message}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div 
      className={`fixed z-40 transition-all duration-300 pointer-events-none ${
        isDetailPageWithStickyBar
          ? 'bottom-20 sm:bottom-6 right-4 sm:right-6' // Dinaikkan di mobile agar tidak bertumpuk dengan Mobile Sticky Bar
          : 'bottom-5 sm:bottom-6 right-4 sm:right-6'
      }`}
    >
      <div className="relative pointer-events-auto">
        {/* --- 1. POPUP DIALOG CONCIERGE CHAT --- */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900"
            >
              {/* Header Card Hijau WhatsApp Elegan */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm backdrop-blur-sm border border-white/20">
                        STP
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-tight">Helpdesk Solo Technopark</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <span>Online • Respon Cepat</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Tutup Dialog Bantuan"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-4 space-y-3 bg-slate-50/70">
                {/* Bubble Chat Balasan Otomatis */}
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-xs border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <p className="font-medium text-slate-900 mb-1">
                    👋 Selamat datang di Kawasan Sains & Teknologi Solo Technopark!
                  </p>
                  <p className="text-slate-600">
                    Ada yang bisa kami bantu mengenai sewa fasilitas, katalog produk inovasi, atau pelatihan vokasi?
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                  <Clock size={12} className="text-slate-400" />
                  <span>Jam operasional CS: 08.00 – 17.00 WIB</span>
                </div>

                {/* Tombol Mulai Chat WhatsApp */}
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={15} className="fill-white" />
                  <span>Mulai Percakapan WhatsApp</span>
                  <Send size={12} className="ml-1" />
                </button>
              </div>

              {/* Footer Mini Trust Badge */}
              <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-600" /> Layanan Resmi UPTD Solo Technopark
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 2. FLOATING TRIGGER BUTTON (HIJAU WHATSAPP RESMI) --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full shadow-xl transition-all duration-300 ${
            isOpen 
              ? 'bg-slate-800 text-white hover:bg-slate-900 scale-95' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-emerald-600/30'
          }`}
          aria-label="Bantuan WhatsApp Solo Technopark"
          title="Tanya Admin Solo Technopark via WhatsApp"
        >
          {/* Ikon WhatsApp / Close */}
          {isOpen ? (
            <X size={22} className="transition-transform group-hover:rotate-90 duration-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              <MessageCircle size={22} className="fill-white transition-transform group-hover:scale-110" />
              {/* Pulse Ping Effect saat belum dibuka */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
            </div>
          )}

          {/* Label Teks (Responsive: Hanya muncul di desktop/layar besar saat belum dibuka) */}
          {!isOpen && (
            <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
              <span className="text-[11px] font-bold tracking-tight">Butuh Bantuan?</span>
              <span className="text-[10px] text-emerald-100 font-medium">Chat WhatsApp</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
