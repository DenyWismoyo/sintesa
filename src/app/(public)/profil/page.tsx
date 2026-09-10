'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { User, BookOpen, CreditCard, LogOut, ArrowLeft, Loader2, GraduationCap, Key, CheckCircle, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import TabDataDiri from './components/TabDataDiri';
import TabRiwayat from './components/TabRiwayat';
import TabTagihan from './components/TabTagihan';
import TabAlumni from './components/TabAlumni';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { alumniService } from '@/services/alumni.service';
import { Alumni } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'data-diri' | 'riwayat' | 'tagihan' | 'alumni'>('data-diri');
  
  const [alumniData, setAlumniData] = useState<Alumni | null>(null);
  const [isCheckingAlumni, setIsCheckingAlumni] = useState(true);
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkAlumniStatus = async () => {
      if (!user) return;
      try {
        const data = await alumniService.getAlumniByUserId(user.uid);
        setAlumniData(data as Alumni);
      } catch (error) {
        console.error("Gagal mengecek status alumni:", error);
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      document.cookie = "userRole=; path=/; max-age=0;";
      toast.success("Berhasil keluar");
      router.push('/login');
    } catch (error) {
      toast.error("Gagal keluar akun");
    }
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode.trim() || !user.uid) return toast.error("Data tidak valid");
    
    setIsClaiming(true);
    try {
      const result = await alumniService.claimAlumni(claimCode.trim(), user.uid);
      if (result.success) {
        toast.success("Klaim Berhasil!", { description: "Selamat datang di jaringan alumni." });
        const refreshed = await alumniService.getAlumniByUserId(user.uid);
        setAlumniData(refreshed as Alumni);
        setActiveTab('alumni');
      } else {
        toast.error("Klaim Gagal", { description: result.error || "Kode registrasi tidak ditemukan." });
      }
    } catch (error: any) {
      toast.error("Terjadi Kesalahan", { description: error.message });
    } finally {
      setIsClaiming(false);
    }
  };

  const menuItems = [
    { id: 'data-diri', label: 'Data Diri', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'riwayat', label: 'Riwayat Pelatihan', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'tagihan', label: 'Tagihan & Pembayaran', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  if (!isCheckingAlumni && alumniData) {
    menuItems.push({ id: 'alumni', label: 'Profil Alumni', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' });
  }

  return (
    <SectionContainer accent="indigo" width="wide">
      {/* Breadcrumb & Header yang Elegan */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900 bg-white shadow-xs rounded-full px-3.5 py-1.5 flex items-center transition-all text-xs font-bold">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Beranda
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akun Saya</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Dashboard Personal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl leading-relaxed">
            Kelola informasi profil, riwayat transaksi, dan akses layanan khusus Anda di satu tempat.
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR NAVIGASI */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Profil Card Elegan */}
          <div className="public-card p-6 relative overflow-hidden group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner relative shrink-0">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={24} />}
                {!isCheckingAlumni && alumniData && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                    <CheckCircle size={12} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black text-slate-900 truncate tracking-tight">{user.displayName || 'Pengguna'}</h2>
                <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            {!isCheckingAlumni && alumniData && (
              <div className="mt-4 flex items-center gap-2 bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-xl">
                <Sparkles size={13} className="text-emerald-500 shrink-0" /> 
                <span className="text-[10px] font-black uppercase tracking-widest truncate">Alumni Terverifikasi</span>
              </div>
            )}
          </div>

          {/* Menu Navigasi */}
          <div className="public-card p-2.5 flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)} 
                  className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 outline-none z-10 ${
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
              )
            })}
            
            <div className="h-px bg-slate-100 my-1.5 mx-3" />
            
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all">
              <div className="p-1.5"><LogOut size={16} /></div> Keluar Akun
            </button>
          </div>

          {/* Form Klaim Kode */}
          {!isCheckingAlumni && !alumniData && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="public-card p-6 bg-gradient-to-br from-emerald-50/60 to-teal-50/20 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <GraduationCap size={90} className="text-emerald-600" />
              </div>
              <h3 className="text-xs font-black text-emerald-900 flex items-center gap-2 mb-1.5 relative z-10">
                <Key size={14}/> Klaim Status Alumni
              </h3>
              <p className="text-[11px] text-emerald-700/80 mb-4 font-medium leading-relaxed relative z-10">
                Masukkan kode registrasi dari Admin untuk membuka akses direktori alumni.
              </p>
              <form onSubmit={handleClaimCode} className="flex gap-2 relative z-10">
                <input 
                  value={claimCode} onChange={(e) => setClaimCode(e.target.value)} placeholder="ALM-XXXXXX"
                  className="flex-1 w-full bg-white text-emerald-900 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-emerald-300 font-mono uppercase shadow-xs"
                />
                <button disabled={isClaiming || !claimCode.trim()} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-10 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md disabled:opacity-50">
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
              {activeTab === 'riwayat' && <TabRiwayat userEmail={user.email!} />}
              {activeTab === 'tagihan' && <TabTagihan userEmail={user.email!} />}
              {activeTab === 'alumni' && alumniData && <TabAlumni initialData={alumniData} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </SectionContainer>
  );
}