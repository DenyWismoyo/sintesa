'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocs, query, collection, where, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

import { Loader2, KeyRound, Lock, BookOpen, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function LMSPortalAuth() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  // Handle Login Google (Sama dengan halaman login utama)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      const userRef = doc(db, 'users', loggedInUser.uid);
      const userSnap = await getDoc(userRef);

      // Pastikan user tercatat di database Firestore
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: loggedInUser.email,
          name: loggedInUser.displayName,
          photoURL: loggedInUser.photoURL,
          role: 'public', // Tetap public, fleksibilitas tinggi
          createdAt: Date.now()
        });
      }
      toast.success("Berhasil Login", { description: "Silakan masukkan kode akses kelas." });
    } catch (err: any) {
      toast.error('Gagal login dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Klaim Kode Akses
  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Silakan login terlebih dahulu!");
    if (!accessCode.trim()) return toast.error("Kode Akses wajib diisi!");
    
    setIsLoading(true);
    try {
      // 1. Cari kelas yang memiliki kode akses yang diketikkan
      const q = query(collection(db, 'trainings'), where('instructorAccessCode', '==', accessCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setIsLoading(false);
        return toast.error("Kode Akses Tidak Valid", { description: "Pastikan Anda meminta kode yang benar ke Admin KST." });
      }

      const trainingDoc = snap.docs[0];
      const trainingId = trainingDoc.id;
      const trainingTitle = trainingDoc.data().title;
      const currentInstructors = trainingDoc.data().authorizedInstructorIds || [];

      // 2. Cek apakah user sudah terdaftar di kelas ini
      if (currentInstructors.includes(user.uid)) {
        toast.info("Anda Sudah Terdaftar", { description: `Anda sudah menjadi instruktur di kelas: ${trainingTitle}` });
        router.push('/lms/dashboard');
        return;
      }

      // 3. Tambahkan UID user ke dalam daftar instruktur kelas
      await updateDoc(doc(db, 'trainings', trainingId), {
        authorizedInstructorIds: arrayUnion(user.uid)
      });

      toast.success("Berhasil Bergabung!", { description: `Anda kini memiliki akses pengajar untuk: ${trainingTitle}` });
      router.push('/lms/dashboard');

    } catch (error: any) {
      console.error(error);
      toast.error("Gagal Memvalidasi Kode", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Modern */}
      <div className="absolute top-0 inset-x-0 h-64 bg-blue-600 rounded-b-[48px] shadow-lg"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
        
        <div className="p-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
           <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
             <KeyRound size={32} className="text-blue-600"/>
           </div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal Instruktur</h1>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">LMS KST Solo Technopark</p>
        </div>

        <div className="p-8">
          {!user ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-bold leading-relaxed shadow-sm">
                 <ShieldAlert size={20} className="mx-auto mb-2 text-amber-500"/>
                 Anda memerlukan Akun Google untuk mengakses portal pengajar.
              </div>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5"/>}
                Masuk dengan Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleClaimCode} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-3 text-blue-800 text-xs font-bold mb-4 shadow-sm">
                 <img src={user.photoURL || ''} alt="Profile" className="w-10 h-10 rounded-xl bg-blue-200 shrink-0 border border-blue-200" onError={(e) => e.currentTarget.style.display = 'none'}/>
                 <div>
                   <p className="text-sm font-black text-slate-800">{user.displayName}</p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">{user.email}</p>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masukkan Kode Akses Kelas</label>
                <div className="relative">
                  <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    value={accessCode} 
                    onChange={e=>setAccessCode(e.target.value.toUpperCase())} 
                    className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-black tracking-widest text-blue-700 text-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all uppercase" 
                    placeholder="KST-XXXXX" 
                  />
                </div>
              </div>
              
              <div className="pt-2 flex flex-col gap-3">
                <button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-70">
                  {isLoading ? <Loader2 className="animate-spin mr-2"/> : <><Lock size={16} className="mr-2"/> Buka Akses Kelas</>}
                </button>
                
                <button type="button" onClick={() => router.push('/lms/dashboard')} className="w-full h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all shadow-sm">
                  Ke Dashboard Instruktur
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}