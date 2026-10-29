// Lokasi file: src/components/auth/AuthFormCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  Key,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Building,
  ClockCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  authService,
  getPostLoginRedirect,
  mapFirebaseAuthError,
} from '@/services/auth.service';

export type AuthTabMode = 'login' | 'register' | 'forgot' | 'tenant';
type RegisterIntent = 'general' | 'alumni' | 'partner';

interface AuthFormCardProps {
  defaultTab?: 'login' | 'register';
}

export default function AuthFormCard({ defaultTab = 'login' }: AuthFormCardProps) {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const tabParam = searchParams.get('tab');
  const resetSuccess = searchParams.get('reset') === '1';

  const [mode, setMode] = useState<AuthTabMode>(
    tabParam === 'daftar' || tabParam === 'register' ? 'register' : defaultTab
  );
  const [intent, setIntent] = useState<RegisterIntent>('general');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [alumniCode, setAlumniCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(
    resetSuccess ? 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.' : ''
  );

  useEffect(() => {
    if (tabParam === 'daftar' || tabParam === 'register') {
      setMode('register');
    } else if (tabParam === 'login') {
      setMode('login');
    }
  }, [tabParam]);

  const switchMode = (next: AuthTabMode) => {
    setMode(next);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setIsGoogleLoading(true);
    try {
      const res = await authService.loginWithGoogle();
      toast.success('Berhasil Masuk!', {
        description: res.isNewUser
          ? 'Akun Anda telah aktif & email sambutan telah dikirim.'
          : 'Selamat datang kembali di Portal Solo Technopark.',
      });
      window.location.href = getPostLoginRedirect(res.role, redirectParam);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);
    try {
      const res = await authService.loginWithEmailPassword(email, password);
      toast.success('Berhasil Masuk!', {
        description: 'Mengarahkan Anda ke halaman portal sesuai hak akses...',
      });
      window.location.href = getPostLoginRedirect(res.role, redirectParam);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);
    try {
      const res = await authService.registerWithEmailPassword({
        name,
        email,
        phone,
        password,
        alumniCode: intent === 'alumni' ? alumniCode : undefined,
      });

      if (res.alumniClaimError) {
        toast.warning('Akun Berhasil Dibuat (Kode Alumni Tertunda)', {
          description: res.alumniClaimError,
        });
      } else if (res.alumniClaimed) {
        toast.success('Pendaftaran & Klaim Alumni Berhasil!', {
          description: 'Email konfirmasi resmi telah dikirim dari marketing@solotechnopark.id.',
        });
      } else {
        toast.success('Pendaftaran Akun Berhasil!', {
          description: 'Cek kotak masuk email Anda untuk konfirmasi dari marketing@solotechnopark.id.',
        });
      }

      window.location.href = getPostLoginRedirect(res.role, redirectParam);
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(email);
      setInfoMsg(
        `Instruksi pengaturan ulang kata sandi telah dikirim ke ${email.trim().toLowerCase()} melalui marketing@solotechnopark.id. Periksa juga folder Spam/Promosi.`
      );
      toast.success('Email Reset Sandi Terkirim');
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTenantCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await authService.loginWithTenantAccessCode(accessCode);
      window.location.href = '/tenant/dashboard';
    } catch (err: any) {
      setErrorMsg(err?.message || 'Kode akses tenant tidak valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.25rem] shadow-2xl shadow-sky-100/60 p-6 sm:p-9 border border-slate-100">
      {/* Header Mobile Logo */}
      <div className="lg:hidden text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center mb-2">
          <Image src="/logo.png" alt="Solo Technopark" width={120} height={60} className="h-10 w-auto object-contain" priority />
        </Link>
        <p className="text-xs text-slate-500 font-semibold">Portal Layanan & Ekosistem Terpadu</p>
      </div>

      {/* Tab Utama: Masuk Akun | Daftar Baru */}
      {(mode === 'login' || mode === 'register') && (
        <div className="grid grid-cols-2 bg-slate-100/90 p-1.5 rounded-2xl mb-6 text-xs sm:text-sm font-bold text-slate-500">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-800'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-800'
            }`}
          >
            Daftar Baru
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200 leading-relaxed">
          {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-2xl border border-emerald-200 flex items-start gap-2 leading-relaxed">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* ==================== MODE 1: MASUK AKUN ==================== */}
      {mode === 'login' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Masuk untuk Pengguna Umum, Alumni STP/RSKB, Mitra Industri, maupun Admin.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  aria-label="Tampilkan sandi"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-blue-700 shadow-md shadow-slate-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk ke Portal'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/80" /></div>
            <div className="relative flex justify-center text-[11px]">
              <span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-wider">atau masuk instan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full py-3 px-4 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin text-blue-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>Lanjutkan dengan Google</span>
          </button>

          {/* Jalur Khusus: Tenant Code & Presensi Pegawai */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchMode('tenant')}
              className="py-2.5 px-3 rounded-xl text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building size={13} />
              <span>Kode Tenant</span>
            </button>
            <Link
              href="/presensi/login"
              className="py-2.5 px-3 rounded-xl text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ClockCheck size={13} />
              <span>Presensi Pegawai</span>
            </Link>
          </div>
        </div>
      )}

      {/* ==================== MODE 2: DAFTAR AKUN BARU ==================== */}
      {mode === 'register' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Buat Akun Baru</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Pilih kategori Anda agar navigasi layanan langsung disesuaikan otomatis.
            </p>
          </div>

          {/* Pilihan Niat Pendaftaran */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setIntent('general')}
              className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                intent === 'general'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User size={15} />
              <span>Umum / Diklat</span>
            </button>
            <button
              type="button"
              onClick={() => setIntent('alumni')}
              className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                intent === 'alumni'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap size={15} />
              <span>Klaim Alumni</span>
            </button>
            <button
              type="button"
              onClick={() => setIntent('partner')}
              className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                intent === 'partner'
                  ? 'border-teal-600 bg-teal-50/70 text-teal-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Briefcase size={15} />
              <span>Calon Mitra</span>
            </button>
          </div>

          {intent === 'partner' && (
            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-900 space-y-2">
              <p className="font-bold">Ingin merekrut talenta atau bermitra sebagai perusahaan?</p>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Akun <strong>Mitra Industri Resmi</strong> diaktifkan melalui formulir Kemitraan B2B agar perusahaan Anda mendapatkan akses Direktori CV & Publikasi Lowongan Prioritas.
              </p>
              <Link
                href="/kemitraan"
                className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-700 hover:text-teal-950 underline"
              >
                <span>Ajukan Kemitraan Resmi di Sini</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          <form onSubmit={handleEmailRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap sesuai identitas"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email Aktif</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">No. WhatsApp</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Buat Kata Sandi</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {intent === 'alumni' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                  <Sparkles size={13} className="text-emerald-600" />
                  <span>Kode Registrasi Alumni STP / RSKB</span>
                </label>
                <input
                  type="text"
                  value={alumniCode}
                  onChange={(e) => setAlumniCode(e.target.value.toUpperCase())}
                  placeholder="CONTOH: AL-2026-XXXXXX / RSKB-..."
                  className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono font-bold uppercase text-emerald-950 outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-emerald-700">
                  Opsional: kosongkan jika belum memegang kode, Anda tetap bisa mengklaim nanti di menu Profil Saya.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              <span>
                {isSubmitting
                  ? 'Membuat Akun & Mengirim Email...'
                  : intent === 'alumni' && alumniCode.trim()
                    ? 'Daftar & Klaim Status Alumni'
                    : 'Daftar & Kirim Email Konfirmasi'}
              </span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Atau daftar 1-klik dengan Akun Google</span>
          </button>
        </div>
      )}

      {/* ==================== MODE 3: LUPA KATA SANDI ==================== */}
      {mode === 'forgot' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Masuk Akun</span>
          </button>

          <div>
            <h2 className="text-xl font-black text-slate-900">Atur Ulang Kata Sandi</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Masukkan alamat email akun Anda. Kami akan mengirimkan tautan pemulihan resmi dari <strong>marketing@solotechnopark.id</strong>.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Alamat email terdaftar"
              className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Mengirim Tautan...' : 'Kirim Tautan Reset ke Email'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================== MODE 4: KODE AKSES TENANT ==================== */}
      {mode === 'tenant' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Masuk Akun</span>
          </button>

          <div>
            <div className="w-11 h-11 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center mb-3">
              <Key size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Kode Akses Tim Tenant</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Masukkan kode akses inkubasi yang diberikan oleh Manajemen Kawasan Solo Technopark.
            </p>
          </div>

          <form onSubmit={handleTenantCodeLogin} className="space-y-4">
            <input
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="SNT-XXXXX"
              className="w-full px-4 py-3.5 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-sky-500 rounded-xl text-center font-mono text-base font-black tracking-widest uppercase outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !accessCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              <span>{isSubmitting ? 'Memvalidasi Kode...' : 'Buka Dashboard Tenant'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

