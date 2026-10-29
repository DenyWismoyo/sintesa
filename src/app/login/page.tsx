// Lokasi file: src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Key, Loader2, Building, ArrowLeft, GraduationCap, Sparkles, Building2, Briefcase, Users, Radio, ClockCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import AuthSplitShell from '@/components/auth/AuthSplitShell';

// Mengambil sedikit data Pentahelix untuk hiasan UI di sisi kiri (opsional tapi bagus untuk branding)
const PENTAHELIX_PREVIEW = [
  { id: 'pemerintah', icon: <Building2 size={18} />, label: 'Pemerintah' },
  { id: 'akademisi', icon: <GraduationCap size={18} />, label: 'Akademisi' },
  { id: 'industri', icon: <Briefcase size={18} />, label: 'Industri' },
  { id: 'komunitas', icon: <Users size={18} />, label: 'Komunitas' },
  { id: 'media', icon: <Radio size={18} />, label: 'Media' }
];

export default function LoginPage() {
  return <AuthSplitShell defaultTab="login" />;
}

function _LegacyLoginPageUnused() {
  // Toggle antara Login Utama (Google) dan Login Tenant (Kode Akses)
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  
  // State for Tenant Login
  const [accessCode, setAccessCode] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // --- FUNGSI 1: LOGIN GOOGLE (OTOMATIS CEK ROLE ADMIN / DIKLAT / TENANT FOUNDER) ---
  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const loginRes = await authService.loginWithGoogle();
      window.location.href = loginRes.role === 'industri' ? '/mitra/dashboard' : '/';
      // Apapun rolenya, arahkan ke Homepage
      // Redirect sudah ditangani di atas
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Jendela login ditutup sebelum proses selesai.');
      } else {
        setError('Gagal login dengan Google. Silakan coba lagi.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- FUNGSI 2: LOGIN TENANT DENGAN KODE AKSES ---
  const handleAccessCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.loginWithTenantAccessCode(accessCode);
      window.location.href = '/tenant/dashboard';
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Gagal memproses otentikasi. Silakan periksa kembali kode akses Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.loginWithPartnerCredentials(partnerEmail, partnerPassword);
      window.location.href = '/mitra/dashboard';
    } catch {
      setError('Email atau kata sandi Mitra tidak sesuai.');
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder tertutup rapi
  const _noop = () => {
    try {
      window.location.href = '/tenant/dashboard';
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Gagal memproses otentikasi. Silakan periksa kembali kode akses Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex relative overflow-hidden text-slate-800">
      
      {/* Background Ornaments (Diambil dari Landing Page) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-sky-100/60 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-50/80 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />

      {/* Main Container: Split Layout di Desktop */}
      <div className="w-full max-w-[90rem] mx-auto flex flex-col lg:flex-row relative z-10 min-h-screen">
        
        {/* --- LEFT PANEL: BRANDING (Hidden on Mobile) --- */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-12 xl:px-24 py-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <Image src="/logo.png" alt="Solo Technopark" width={180} height={98} className="h-14 w-auto object-contain" priority />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200/60 text-xs font-bold tracking-widest uppercase text-red-700 mb-8 backdrop-blur-sm">
              <Sparkles size={16} className="text-red-600" />
              <span>Katalog Solo Technopark</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-[1.2] mb-6">
              Masuk ke Portal <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-slate-800">
                Solo Technopark
              </span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed font-medium">
              Satu pintu akses untuk mengelola katalog, reservasi fasilitas, program pelatihan, dan layanan kawasan terpadu.
            </p>

            {/* Ekosistem Miniatur */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sinergi Pentahelix</p>
              <div className="flex flex-wrap gap-3">
                {PENTAHELIX_PREVIEW.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-sky-100 rounded-xl shadow-sm text-sm font-bold text-blue-900">
                    <span className="text-sky-500">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- RIGHT PANEL: FORM LOGIN --- */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-sky-100/50 p-8 sm:p-10 border border-white"
          >
            
            {/* Header Form Mobile Only Logo */}
            <div className="lg:hidden text-center mb-8">
               <div className="h-12 mx-auto flex items-center justify-center mb-3">
                  <Image src="/logo.png" alt="Solo Technopark" width={110} height={60} className="h-11 w-auto object-contain" priority />
               </div>
               <h2 className="text-2xl font-black text-slate-900">Katalog STP</h2>
               <p className="text-xs text-slate-400 font-semibold mt-1">katalog.solotechnopark.id</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 text-center flex items-center gap-2 justify-center"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* VIEW 1: GOOGLE LOGIN */}
              {!showTenantForm && !showPartnerForm ? (
                <motion.div 
                  key="google-login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-8 hidden lg:block">
                    <h2 className="text-3xl font-black text-blue-950 mb-2">Selamat Datang</h2>
                    <p className="text-slate-500 font-medium text-sm">Silakan masuk untuk melanjutkan ke dashboard Anda.</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading || isLoading}
                      className="w-full flex justify-center items-center gap-3 py-4 px-4 border-2 border-slate-100 rounded-2xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-sky-200 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-sky-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                      
                      <div className="relative z-10 flex items-center gap-3">
                        {isGoogleLoading ? (
                          <Loader2 className="animate-spin h-5 w-5 text-sky-500" />
                        ) : (
                          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        )}
                        <span>{isGoogleLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}</span>
                      </div>
                    </button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest rounded-full">Akses Alternatif</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => { setShowTenantForm(true); setError(''); }}
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                      >
                        <Building size={16} />
                        Masuk sebagai Tim Tenant</button>
                      <button
                        type="button"
                        onClick={() => { setShowPartnerForm(true); setShowTenantForm(false); setError(''); }}
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200/70"
                      >
                        <Briefcase size={16} className="text-teal-600" />
                        Masuk sebagai Mitra Industri Resmi
                      </button>

                      <Link
                        href="/presensi/login"
                        className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200/80"
                      >
                        <ClockCheck size={16} className="text-emerald-600" />
                        Presensi Pegawai STP (Techno Sign)
                      </Link>
                    </div>
                  </div>
                </motion.div>

              ) : showPartnerForm ? (
                <motion.div
                  key="partner-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <button
                    type="button"
                    onClick={() => { setShowPartnerForm(false); setError(''); }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors mb-2 group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali
                  </button>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal Mitra Resmi</h2>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Masuk menggunakan Email PIC & Kata Sandi Mitra yang dikirimkan oleh Tim Karir Solo Technopark.
                    </p>
                  </div>
                  <form onSubmit={handlePartnerLogin} className="space-y-4">
                    <input
                      type="email"
                      required
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="block w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 text-sm font-semibold outline-none bg-slate-50 focus:bg-white"
                      placeholder="Email PIC Perusahaan"
                    />
                    <input
                      type="password"
                      required
                      value={partnerPassword}
                      onChange={(e) => setPartnerPassword(e.target.value)}
                      className="block w-full px-4 py-3.5 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 text-sm font-semibold outline-none bg-slate-50 focus:bg-white"
                      placeholder="Kata Sandi Portal Mitra"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !partnerEmail.trim() || !partnerPassword}
                      className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70"
                    >
                      {isLoading ? 'Memverifikasi Akses Mitra...' : 'Masuk ke Portal Mitra (/mitra)'}
                    </button>
                  </form>
                </motion.div>
              ) : (
                
                /* VIEW 2: KODE AKSES TENANT */
                <motion.div 
                  key="tenant-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => { setShowTenantForm(false); setError(''); }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-4 group"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali
                  </button>

                  <div className="mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-sky-200">
                      <Key size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-blue-950 tracking-tight">Kode Akses</h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                      Masukkan kode akses khusus yang diberikan oleh Administrator Tenant Anda.
                    </p>
                  </div>

                  <form onSubmit={handleAccessCodeLogin} className="space-y-6">
                    <div>
                      <input
                        type="text"
                        required
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="block w-full px-5 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-lg font-black tracking-widest uppercase outline-none transition-all placeholder-slate-300 bg-slate-50 focus:bg-white text-center"
                        placeholder="SNT-XXXXX"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !accessCode.trim()}
                      className="w-full relative flex justify-center items-center py-4 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] overflow-hidden group"
                    >
                      <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
                      <span className="relative flex items-center">
                        {isLoading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Memvalidasi...</> : 'Akses Dashboard Tenant'}
                      </span>
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </div>
    </div>
  );
}