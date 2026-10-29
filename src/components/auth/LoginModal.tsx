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
  Loader2, 
  Building2, 
  Key, 
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoginModal } from '@/context/LoginModalContext';
import { authService, getPostLoginRedirect, mapFirebaseAuthError } from '@/services/auth.service';
import { APP_ROLES, isInternalStaff } from '@/config/roles';

export default function LoginModal() {
  const router = useRouter();
  const { isOpen, options, closeLoginModal } = useLoginModal();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'tenant'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [alumniCode, setAlumniCode] = useState('');
  const [showAlumniInput, setShowAlumniInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Lock body scroll saat modal aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMsg(null);
      setInfoMsg(null);
      setAccessCode('');
      setPassword('');
      setMode(options.initialMode || 'login');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, options.initialMode]);

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

  const finalizePostAuth = (role: string) => {
    if (options.onSuccess) {
      try {
        options.onSuccess();
      } catch (callbackErr) {
        console.warn('Error saat menjalankan callback onSuccess:', callbackErr);
      }
    }

    if (options.redirectTo) {
      router.push(options.redirectTo);
    } else if (role === APP_ROLES.INDUSTRI || role === APP_ROLES.TENANT || isInternalStaff(role)) {
      router.push(getPostLoginRedirect(role));
    }

    closeLoginModal();
  };

  // Handler Login Google via Pop-up
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsGoogleLoading(true);

    try {
      const result = await authService.loginWithGoogle();
      const displayName = result.user.displayName || result.user.email?.split('@')[0] || 'Pengguna';
      toast.success('Berhasil Masuk!', {
        description: `Selamat datang, ${displayName}. Sesi Anda telah aktif.`,
        icon: <CheckCircle2 className="text-emerald-500" size={18} />
      });
      finalizePostAuth(result.role);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handler Login Email & Kata Sandi
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsFormLoading(true);

    try {
      const result = await authService.loginWithEmailPassword(email, password);
      toast.success('Berhasil Masuk!', {
        description: 'Sesi portal Anda kini telah aktif.',
      });
      finalizePostAuth(result.role);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handler Pendaftaran Akun Baru via Email & Kata Sandi
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsFormLoading(true);

    try {
      const result = await authService.registerWithEmailPassword({
        name,
        email,
        phone,
        password,
        alumniCode: showAlumniInput ? alumniCode : undefined,
      });

      if (result.alumniClaimError) {
        toast.warning('Akun Aktif (Klaim Kode Alumni Tertunda)', {
          description: result.alumniClaimError,
        });
      } else {
        toast.success(
          result.alumniClaimed ? 'Pendaftaran & Klaim Alumni Berhasil!' : 'Pendaftaran Akun Berhasil!',
          {
            description: 'Email konfirmasi telah dikirim dari marketing@solotechnopark.id.',
          }
        );
      }

      if (!options.redirectTo && result.alumniClaimed) {
        router.push('/alumni-portal');
        closeLoginModal();
        return;
      }

      finalizePostAuth(result.role);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handler Lupa Kata Sandi
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsFormLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setInfoMsg('Tautan atur ulang kata sandi telah dikirim ke email Anda melalui marketing@solotechnopark.id.');
      toast.success('Email Reset Sandi Terkirim');
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handler Login Tenant via Kode Akses
  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsFormLoading(true);

    try {
      const result = await authService.loginWithTenantAccessCode(accessCode);
      toast.success('Akses Tenant Terverifikasi!', {
        description: `Selamat datang, ${result.tenantName}.`,
        icon: <Building2 className="text-teal-600" size={18} />
      });

      if (options.onSuccess) {
        options.onSuccess();
      }
      router.push(options.redirectTo || '/tenant/dashboard');
      closeLoginModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kode akses tidak valid. Periksa kembali kode Anda.');
    } finally {
      setIsFormLoading(false);
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

              <h2 id="login-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {options.title || (mode === 'register' ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs mx-auto leading-relaxed">
                {options.subtitle || 'Satu akun untuk e-katalog, reservasi fasilitas, pelatihan, & ekosistem alumni.'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-snug text-center">
                {errorMsg}
              </div>
            )}
            {infoMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 leading-snug text-center">
                {infoMsg}
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="grid grid-cols-3 bg-slate-100/90 p-1 rounded-xl mb-4 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setInfoMsg(null); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'login' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(null); setInfoMsg(null); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'register' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  Daftar Baru
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('tenant'); setErrorMsg(null); setInfoMsg(null); }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    mode === 'tenant' ? 'bg-white text-teal-800 shadow-xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  <Building2 size={12} />
                  <span>Tenant</span>
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="space-y-3.5">
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Alamat email Anda"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kata sandi"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMsg(null); setInfoMsg(null); }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isFormLoading || isGoogleLoading}
                    className="w-full h-11 bg-slate-900 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isFormLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>{isFormLoading ? 'Memproses...' : 'Masuk dengan Email'}</span>
                  </button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">atau 1-klik</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <button
                  type="button"
                  disabled={isGoogleLoading || isFormLoading}
                  onClick={handleGoogleLogin}
                  className="w-full h-11 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2.5 font-bold text-slate-800 text-xs sm:text-sm cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 size={17} className="animate-spin text-slate-600" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Lanjutkan dengan Google</span>
                </button>
              </div>
            )}

            {mode === 'register' && (
              <form onSubmit={handleEmailRegister} className="space-y-2.5">
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email aktif"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="No. WhatsApp"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Buat kata sandi (min. 6 karakter)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowAlumniInput((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <GraduationCap size={14} />
                    <span>{showAlumniInput ? 'Sembunyikan Kode Alumni' : 'Punya Kode Lulusan Diklat STP / RSKB? Klik di sini'}</span>
                  </button>
                  {showAlumniInput && (
                    <input
                      type="text"
                      value={alumniCode}
                      onChange={(e) => setAlumniCode(e.target.value.toUpperCase())}
                      placeholder="AL-2026-XXXXXX / RSKB-..."
                      className="mt-1.5 w-full px-3.5 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-mono font-bold uppercase text-emerald-950 outline-none"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isFormLoading || isGoogleLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isFormLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{isFormLoading ? 'Mendaftarkan Akun...' : 'Daftar & Kirim Email Konfirmasi'}</span>
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setInfoMsg(null); }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Masuk</span>
                </button>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email akun Anda"
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold outline-none"
                />
                <button
                  type="submit"
                  disabled={isFormLoading || !email.trim()}
                  className="w-full h-11 bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isFormLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Kirim Tautan Reset ke Email</span>
                </button>
              </form>
            )}

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
                </div>

                <button
                  type="submit"
                  disabled={isFormLoading || !accessCode.trim()}
                  className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isFormLoading ? (
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

            <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/login"
                  onClick={closeLoginModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <span>Halaman Login</span>
                  <ExternalLink size={12} />
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/daftar"
                  onClick={closeLoginModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>Halaman Daftar</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
              <div>
                <Link
                  href="/presensi/login"
                  onClick={closeLoginModal}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Pegawai STP? Masuk Presensi Pegawai</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
