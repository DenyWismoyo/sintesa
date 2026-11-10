'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import {
  User,
  BookOpen,
  CreditCard,
  LogOut,
  ArrowLeft,
  Loader2,
  GraduationCap,
  Key,
  CheckCircle,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Share2,
  Clock,
  MailCheck,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  LayoutGrid,
} from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import PillTabs, { PillTabItem } from '@/components/ui/PillTabs';
import TabDataDiri from './components/TabDataDiri';
import TabRiwayat from './components/TabRiwayat';
import TabTagihan from './components/TabTagihan';
import TabAlumni from './components/TabAlumni';
import TabAfiliasi from './components/TabAfiliasi';
import TabKarirAlumni from './components/TabKarirAlumni';
import ProfileRoleQuickAccess from './components/ProfileRoleQuickAccess';
import AlumniInvitationsBox from '@/components/career/AlumniInvitationsBox';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { alumniService } from '@/services/alumni.service';
import { authService } from '@/services/auth.service';
import { Alumni, ALUMNI_ORIGIN_LABELS } from '@/types';
import { ROLE_LABELS, APP_ROLES } from '@/config/roles';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePublicQuerySync } from '@/hooks/usePublicQuerySync';

type ProfileTab = 'data-diri' | 'peran' | 'riwayat' | 'tagihan' | 'afiliasi' | 'karir' | 'alumni';

function ProfilContent() {
  const { user, role, loading: authLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const { getQuery, updateQuery } = usePublicQuerySync();

  const initialTab = (getQuery('tab') as ProfileTab) || 'data-diri';
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const [alumniData, setAlumniData] = useState<Alumni | null>(null);
  const [detectedDormantAlumni, setDetectedDormantAlumni] = useState<Alumni | null>(null);
  const [isCheckingAlumni, setIsCheckingAlumni] = useState(true);
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isResendingMail, setIsResendingMail] = useState(false);
  const [emailVerifiedState, setEmailVerifiedState] = useState<boolean>(true);

  // Sync tab change to URL
  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    updateQuery({ tab: tab === 'data-diri' ? null : tab });
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setEmailVerifiedState(Boolean(user.emailVerified));
    }
  }, [user]);

  useEffect(() => {
    const checkAlumniStatus = async () => {
      if (!user) return;
      try {
        const data = await alumniService.getAlumniByUserId(user.uid);
        if (data) {
          setAlumniData(data as Alumni);
          setDetectedDormantAlumni(null);
        } else if (user.email) {
          const dormant = await alumniService.findUnclaimedAlumniByEmail(user.email);
          if (dormant) {
            setDetectedDormantAlumni(dormant);
            if (dormant.registrationCode) {
              setClaimCode(dormant.registrationCode);
            }
          }
        }
      } catch (error) {
        console.error('Gagal mengecek status alumni:', error);
      } finally {
        setIsCheckingAlumni(false);
      }
    };
    checkAlumniStatus();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleResendVerification = async () => {
    setIsResendingMail(true);
    try {
      const res = await authService.sendWelcomeVerificationEmail();
      if (res.alreadyVerified) {
        setEmailVerifiedState(true);
        toast.success('Email Anda sudah terverifikasi!');
      } else {
        toast.success('Email Konfirmasi Terkirim!', {
          description: `Silakan cek kotak masuk ${user.email} dari marketing@solotechnopark.id.`,
        });
      }
    } catch (err: any) {
      toast.error('Gagal mengirim ulang email', { description: err?.message });
    } finally {
      setIsResendingMail(false);
    }
  };

  const handleCheckVerifiedStatus = async () => {
    try {
      await user.reload();
      const verified = Boolean(auth.currentUser?.emailVerified);
      setEmailVerifiedState(verified);
      if (verified) {
        toast.success('Selamat! Alamat email Anda kini telah terverifikasi.');
      } else {
        toast.info('Belum Terverifikasi', {
          description: 'Klik tombol konfirmasi di dalam email yang kami kirimkan terlebih dahulu.',
        });
      }
    } catch {
      toast.error('Gagal memuat ulang status verifikasi.');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Berhasil keluar');
      router.push('/login');
    } catch {
      toast.error('Gagal keluar akun');
    }
  };

  const handleClaimCode = async (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const codeToUse = (directCode || claimCode).trim();
    if (!codeToUse || !user.uid) return toast.error('Masukkan Kode Registrasi atau NIK KTP Anda.');

    setIsClaiming(true);
    try {
      const result = await alumniService.claimAlumni(codeToUse, user.uid);
      if (result.success) {
        await refreshAuth();
        toast.success('Klaim Status Alumni Berhasil!', {
          description: 'Akses Bursa Karir Eksklusif & Portofolio Talenta Anda kini telah aktif.',
        });
        const refreshed = await alumniService.getAlumniByUserId(user.uid);
        setAlumniData(refreshed as Alumni);
        setDetectedDormantAlumni(null);
        handleTabChange('alumni');
      } else {
        toast.error('Klaim Gagal', { description: result.error || 'Kode registrasi atau NIK tidak ditemukan.' });
      }
    } catch (error: any) {
      toast.error('Terjadi Kesalahan', { description: error.message });
    } finally {
      setIsClaiming(false);
    }
  };

  // Navigasi menu profile
  const menuItems = [
    { id: 'data-diri', label: 'Data Diri', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'peran', label: 'Pusat Peran & Menu', icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'riwayat', label: 'Riwayat Aktivitas', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'tagihan', label: 'Tagihan & Bayar', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'afiliasi', label: 'Program Afiliasi', icon: Share2, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'karir', label: 'Bursa Karir', icon: Briefcase, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  if (!isCheckingAlumni && alumniData) {
    menuItems.push({ id: 'alumni', label: 'Profil Alumni', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' });
  }

  // PillTabs item format for mobile/tablet
  const mobilePillTabs: PillTabItem[] = menuItems.map((item) => {
    const Icon = item.icon;
    return {
      key: item.id,
      label: item.label,
      icon: <Icon size={14} />,
    };
  });

  const roleLabel = (role && ROLE_LABELS[role]) || 'Pengguna Umum / Mitra';

  return (
    <SectionContainer accent="indigo" width="wide">
      {/* Header Halaman */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <button
            onClick={() => router.push('/')}
            className="text-slate-500 hover:text-slate-900 bg-white shadow-xs rounded-full px-3.5 py-1.5 flex items-center transition-all text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Beranda
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dashboard Personal</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Dashboard Personal & Profil
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl leading-relaxed">
              Kelola biodata resmi, status hak akses, riwayat transaksi, dan menu terintegrasi Solo Technopark.
            </p>
          </div>

          {/* Role Pill di Header Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>{roleLabel}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Banner Peringatan Verifikasi Email */}
      {!emailVerifiedState && user.email && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <MailCheck size={20} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-950">Konfirmasi Alamat Email Anda</h3>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                Kami telah mengirimkan tautan konfirmasi ke <strong>{user.email}</strong> dari <strong>marketing@solotechnopark.id</strong>. Verifikasi email untuk mengaktifkan notifikasi transaksi & pemulihan akun.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isResendingMail}
              onClick={handleResendVerification}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isResendingMail ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>Kirim Ulang Email</span>
            </button>
            <button
              type="button"
              onClick={handleCheckVerifiedStatus}
              className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Periksa kembali status setelah klik link di email"
            >
              <RefreshCw size={13} />
              <span>Cek Status</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Deteksi Otomatis Riwayat Alumni (1-Click Claim Organik) */}
      {detectedDormantAlumni && !alumniData && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 mb-1">
                <Sparkles size={12} /> Data Pelatihan Terdeteksi
              </div>
              <h3 className="text-sm font-black text-slate-900">
                Halo, {detectedDormantAlumni.name}!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Email Anda terdaftar sebagai peserta <strong>{detectedDormantAlumni.programTaken}</strong>
                {detectedDormantAlumni.partnerInstitution ? ` (${detectedDormantAlumni.partnerInstitution})` : ''}
                {detectedDormantAlumni.nik ? ` • NIK: ${detectedDormantAlumni.nik}` : ''}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isClaiming}
              onClick={() => handleClaimCode(undefined, detectedDormantAlumni.registrationCode)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {isClaiming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              <span>Aktifkan Akun Alumni (1-Klik)</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigasi Horizontal Tabs untuk Smartphone & Tablet (<1024px) */}
      <div className="lg:hidden mb-6">
        <PillTabs
          tabs={mobilePillTabs}
          active={activeTab}
          onChange={(tab) => handleTabChange(tab as ProfileTab)}
          layoutId="mobile-profile-pill-tabs"
          ariaLabel="Navigasi Menu Profil"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR NAVIGASI DESKTOP (≥1024px) */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Profil Card Elegan */}
          <div className="public-card p-6 relative overflow-hidden group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md shadow-indigo-500/20 relative shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover rounded-2xl" />
                ) : user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <User size={24} />
                )}
                {!isCheckingAlumni && alumniData && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                    <CheckCircle size={12} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-slate-900 truncate tracking-tight">{user.displayName || 'Pengguna'}</h2>
                <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
                <div className="mt-1">
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {!isCheckingAlumni && alumniData && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-xl">
                  <Sparkles size={13} className="text-emerald-500 shrink-0" /> 
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">
                    {alumniData.originSource && ALUMNI_ORIGIN_LABELS[alumniData.originSource]
                      ? ALUMNI_ORIGIN_LABELS[alumniData.originSource]
                      : 'Alumni Terverifikasi STP'}
                  </span>
                </div>
                <Link
                  href="/karir"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Buka Bursa Karir Eksklusif</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/alumni-portal"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  <span className="flex items-center gap-1.5"><MessageSquare size={13} /> Forum Eksklusif Alumni</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Menu Navigasi Vertikal Desktop */}
          <div className="public-card p-2.5 flex flex-col gap-1 hidden lg:flex">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button 
                  key={item.id}
                  onClick={() => handleTabChange(item.id as ProfileTab)} 
                  className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 outline-none z-10 cursor-pointer ${
                    isActive ? 'text-slate-900 font-black' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeProfileMenuTab"
                      className="absolute inset-0 bg-slate-100/90 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isActive ? item.bg : 'bg-transparent'} ${isActive ? item.color : 'text-slate-400'}`}>
                      <Icon size={16} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={15} className="text-slate-400" />}
                </button>
              );
            })}
            
            <div className="h-px bg-slate-100 my-1.5 mx-3" />
            
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
              <div className="p-1.5"><LogOut size={16} /></div> Keluar Akun
            </button>
          </div>

          {/* Form Klaim Kode / NIK di Sidebar */}
          {!isCheckingAlumni && !alumniData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="public-card p-6 bg-gradient-to-br from-emerald-50/60 to-teal-50/20 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <GraduationCap size={90} className="text-emerald-600" />
              </div>
              <h3 className="text-xs font-black text-emerald-900 flex items-center gap-2 mb-1.5 relative z-10">
                <Key size={14}/> Klaim Status Alumni
              </h3>
              <p className="text-[11px] text-emerald-700/80 mb-3.5 font-medium leading-relaxed relative z-10">
                Masukkan Kode Registrasi (AL-... / P3MI-... / RSKB-...) atau NIK KTP Anda (opsional) untuk membuka akses Bursa Karir & Portofolio Talenta.
              </p>
              <form onSubmit={handleClaimCode} className="flex gap-2 relative z-10">
                <input 
                  value={claimCode} 
                  onChange={(e) => setClaimCode(e.target.value)} 
                  placeholder="Kode Registrasi / NIK KTP"
                  className="flex-1 w-full bg-white text-emerald-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-emerald-400 font-mono uppercase shadow-xs"
                />
                <button disabled={isClaiming || !claimCode.trim()} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer">
                  {isClaiming ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          )}

        </motion.div>

        {/* KONTEN UTAMA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex-1 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="public-card p-6 sm:p-8 lg:p-10 h-full"
            >
              {activeTab === 'data-diri' && <TabDataDiri user={user} />}
              {activeTab === 'peran' && <ProfileRoleQuickAccess />}
              {activeTab === 'riwayat' && <TabRiwayat userEmail={user.email!} userName={user.displayName || ''} />}
              {activeTab === 'tagihan' && <TabTagihan userEmail={user.email!} />}
              {activeTab === 'alumni' && alumniData && (
                <>
                  <AlumniInvitationsBox alumniId={alumniData.id} />
                  <TabAlumni initialData={alumniData} />
                </>
              )}
              {activeTab === 'afiliasi' && <TabAfiliasi user={user} />}
              {activeTab === 'karir' && (
                <TabKarirAlumni
                  userEmail={user.email!}
                  alumniProgram={alumniData?.programTaken}
                  alumniProfile={alumniData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </SectionContainer>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    }>
      <ProfilContent />
    </Suspense>
  );
}
