// Lokasi file: src/components/auth/LoginModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  Building2, 
  Key, 
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoginModal } from '@/context/LoginModalContext';
import { authService } from '@/services/auth.service';

export default function LoginModal() {
  const router = useRouter();
  const { isOpen, options, closeLoginModal } = useLoginModal();

  const [mode, setMode] = useState<'google' | 'tenant'>('google');
  const [accessCode, setAccessCode] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isTenantLoading, setIsTenantLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lock body scroll saat modal aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMsg(null);
      setAccessCode('');
      setMode('google');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Listener tombol ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeLoginModal]);

  // Handler Login Google via Pop-up
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);

    try {
      const result = await authService.loginWithGoogle();
      
      const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'Pengguna';
      toast.success('Berhasil Masuk!', {
        description: `Selamat datang kembali, ${displayName}. Sesi Anda telah aktif.`,
        icon: <CheckCircle2 className="text-emerald-500" size={18} />
      });

      // Panggil callback onSuccess jika ada
      if (options.onSuccess) {
        try {
          options.onSuccess();
        } catch (callbackErr) {
          console.warn('Error saat menjalankan callback onSuccess:', callbackErr);
        }
      }

      // Jika ada redirectTo spesifik yang diminta
      if (options.redirectTo) {
        router.push(options.redirectTo);
      }

      // Tutup modal popup tanpa me-reload atau meninggalkan halaman aktif
      closeLoginModal();

    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User menutup popup secara manual
        setErrorMsg('Jendela login Google ditutup. Silakan coba lagi jika ingin masuk.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Terlalu banyak klik popup
        setErrorMsg('Permintaan login sedang diproses. Mohon tunggu.');
      } else {
        setErrorMsg('Gagal masuk dengan Google. Pastikan koneksi stabil dan coba kembali.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handler Login Tenant via Kode Akses
  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsTenantLoading(true);

    try {
      const result = await authService.loginWithTenantAccessCode(accessCode);
      
      toast.success('Akses Tenant Terverifikasi!', {
        description: `Selamat datang, ${result.tenantName}.`,
        icon: <Building2 className="text-teal-600" size={18} />
      });

      if (options.onSuccess) {
        options.onSuccess();
      }

      if (options.redirectTo) {
        router.push(options.redirectTo);
      } else {
        // Jika login khusus tenant via kode, arahkan ke dashboard tenant
        router.push('/tenant/dashboard');
      }

      closeLoginModal();

    } catch (err: any) {
      console.error('Tenant Login Error:', err);
      setErrorMsg(err.message || 'Kode akses tidak valid. Periksa kembali kode Anda.');
    } finally {
      setIsTenantLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          aria-labelledby="login-modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeLoginModal}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-slate-100 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] overflow-hidden p-6 sm:p-8 z-10"
          >
            {/* Ambient Lighting Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/80 via-sky-50/40 to-transparent pointer-events-none" />
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* Tombol Tutup X */}
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors z-20 cursor-pointer"
              title="Tutup (Esc)"
              aria-label="Tutup modal login"
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div className="text-center relative z-10 mb-6">
              {/* Logo Solo Technopark */}
              <div className="inline-flex items-center justify-center mb-3">
                <Image
                  src="/logo.png"
                  alt="Solo Technopark"
                  width={140}
                  height={50}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </div>

              {/* Badge Identitas */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/60 text-[11px] font-bold text-red-700 tracking-wide uppercase mb-3">
                <Sparkles size={13} className="text-red-600" />
                <span>Portal Layanan & Ekosistem</span>
              </div>

              <h2 id="login-modal-title" className="text-2xl font-black text-slate-900 tracking-tight">
                {options.title || 'Masuk ke Akun Anda'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
                {options.subtitle || 'Akses satu pintu untuk e-katalog, reservasi fasilitas, diklat, dan ekosistem inovasi.'}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-snug text-center"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Mode Selector Tabs (Google Utama vs Tenant Code) */}
            <div className="flex bg-slate-100/90 p-1 rounded-xl mb-5 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => { setMode('google'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'google' 
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <span>Akun Utama (Google)</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('tenant'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'tenant' 
                    ? 'bg-white text-teal-800 shadow-xs font-extrabold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <Building2 size={13} />
                <span>Tenant Startup</span>
              </button>
            </div>

            {/* Konten Mode 1: Login Google */}
            {mode === 'google' && (
              <div className="space-y-4">
                {/* Tombol Utama Google */}
                <button
                  type="button"
                  disabled={isGoogleLoading}
                  onClick={handleGoogleLogin}
                  className="w-full h-13 px-5 bg-white hover:bg-slate-50/90 active:bg-slate-100 border-2 border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 font-bold text-slate-800 text-sm sm:text-base group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-slate-600" />
                      <span>Membuka Google OAuth...</span>
                    </>
                  ) : (
                    <>
                      {/* Logo Resmi Google SVG */}
                      <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Lanjutkan dengan Google</span>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all ml-auto" />
                    </>
                  )}
                </button>

                {/* Deskripsi Keunggulan */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Login instan tanpa perlu mengingat kata sandi. Anda akan tetap berada di halaman ini setelah proses selesai.
                  </p>
                </div>
              </div>
            )}

            {/* Konten Mode 2: Login Kode Akses Tenant */}
            {mode === 'tenant' && (
              <form onSubmit={handleTenantLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kode Akses Tenant Startup
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Key size={16} />
                    </div>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="CONTOH: TNT-SOLO-2026"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono tracking-wider font-bold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all uppercase"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Kode akses diberikan resmi oleh Manajemen Kawasan Solo Technopark.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isTenantLoading || !accessCode.trim()}
                  className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTenantLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memverifikasi Kode...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk Portal Tenant</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider Halus */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px bg-slate-200/80 flex-1" />
              <span className="text-[11px] font-semibold text-slate-400">atau</span>
              <div className="h-px bg-slate-200/80 flex-1" />
            </div>

            {/* Opsi Navigasi ke Halaman Penuh */}
            <div className="text-center">
              <Link
                href="/login"
                onClick={closeLoginModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1 group"
              >
                <span>Buka Halaman Login Penuh</span>
                <ExternalLink size={13} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
