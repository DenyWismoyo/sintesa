'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UploadCloud, CheckCircle, AlertCircle, Loader2, FileImage, ShieldCheck, Receipt, Building, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Import Tipe Data dari types Anda
import { Invoice } from '@/types';
import { billingService } from '@/services/billing.service';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { formatRupiah } from '@/utils/format';

// Firebase imports 
import { db, storage, auth } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { collection, collectionGroup, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { compressImage } from '@/lib/imageCompression';

// Tipe modifikasi untuk menyimpan path asli dokumen dari database
type InvoiceWithLocation = Invoice & { path: string };

function BuktiBayarContent() {
  const searchParams = useSearchParams();
  const initialInv = searchParams.get('inv') || '';

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialInv);
  const [isSearching, setIsSearching] = useState(false);
  
  const [invoice, setInvoice] = useState<InvoiceWithLocation | null>(null);
  const [searchError, setSearchError] = useState('');

  const [amount, setAmount] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? (window as any).__initial_auth_token : undefined;
        
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await auth.authStateReady(); 
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        }
      } catch (err: any) {
        console.error("Auth Error Detail:", err);
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          setSearchError('Gagal otentikasi publik. Harap aktifkan "Anonymous / Anonim" pada menu Sign-in method di Firebase Console Anda.');
        }
      } finally {
        if (isMounted) setIsAuthReady(true);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isMounted) setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthReady && initialInv && !invoice) {
      handleSearch(initialInv);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady]);

  const handleSearch = async (queryStr: string = searchQuery) => {
    if (!queryStr.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setInvoice(null);

    try {
      await auth.authStateReady();
      if (!auth.currentUser) {
        throw new Error('Sesi gagal dimuat, silakan muat ulang halaman.');
      }

      const appId = getAppId();
      const targetQuery = queryStr.trim();
      
      // Menggunakan query terarah 1-read yang cepat dan hemat kuota (R-028)
      const inv = await billingService.getInvoiceByNumber(targetQuery);

      if (!inv || !inv.id) {
        setSearchError('Nomor Tagihan (Invoice) tidak ditemukan. Pastikan format sudah benar, contoh: INV/UMUM/2026...');
      } else {
        const invData = {
          ...inv,
          path: `artifacts/${appId}/public/data/invoices/${inv.id}`
        } as InvoiceWithLocation;
        setInvoice(invData);
        
        const safeAmount = invData.remainingAmount ?? invData.totalAmount ?? 0;
        setAmount(safeAmount.toString());
      }
    } catch (err: any) {
      console.error("Search Error:", err);
      if (err.message?.includes('permission')) {
        setSearchError('Akses ditolak: Anda tidak memiliki izin untuk melihat tagihan ini.');
      } else if (err.code === 'auth/admin-restricted-operation') {
         setSearchError('Tindakan ditolak oleh server Firebase. Harap pastikan Anonymous Auth aktif.');
      } else {
        setSearchError(err.message || 'Gagal terhubung ke server sistem. Silakan coba beberapa saat lagi.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice || !invoice.path || !amount || !file) return;

    setIsSubmitting(true);
    try {
      const appId = getAppId();
      
      const fileExt = file.name.split('.').pop() || 'png';
      // Menggunakan folder receipts yang juga sesuai dengan fungsi Kasir
      const storageRef = ref(storage, `receipts/${appId}/${invoice.id}_${Date.now()}.${fileExt}`);
      const uploadFile = await compressImage(file);
      await uploadBytes(storageRef, uploadFile);
      const fileUrl = await getDownloadURL(storageRef);

      const invRef = doc(db, invoice.path);
      
      const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: Number(amount),
        method: 'TRANSFER',
        status: 'PENDING', 
        receiptUrl: fileUrl
      };

      await updateDoc(invRef, {
        history: arrayUnion(newHistoryItem)
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Submit Error:", err);
      if (err.message?.includes('permission')) {
        alert("Sesi Anda berakhir atau akses ditolak. Sistem akan memuat ulang halaman.");
        window.location.reload();
      } else {
        alert("Gagal mengirim bukti pembayaran. Pastikan ukuran file tidak melebihi batas (Maksimal 5MB) dan koneksi internet stabil.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <SectionContainer width="narrow" accent="indigo">
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-500 font-bold text-sm animate-pulse">Menyiapkan portal aman...</p>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer width="narrow" accent="indigo">
      <div className="w-full max-w-lg mx-auto mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 shadow-soft mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Portal Konfirmasi Pembayaran</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium mt-2 max-w-sm mx-auto">
          Unggah bukti transfer Anda agar sistem dapat memverifikasi tagihan secara instan.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.96 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-lg mx-auto public-card p-8 sm:p-10 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Bukti Berhasil Dikirim!</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Terima kasih! Bukti transfer untuk invoice <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-lg">{invoice?.invoiceNumber}</strong> telah kami terima. Tim Kasir kami akan segera melakukan verifikasi pada sistem.
            </p>
            <button 
              onClick={() => window.location.href = '/'} 
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md"
            >
              Kembali ke Beranda
            </button>
          </motion.div>
        ) : invoice ? (
          <motion.div 
            key="form" 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-lg mx-auto public-card overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white flex justify-between items-center shadow-inner">
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Nomor Tagihan (Invoice)</p>
                <p className="font-mono text-base sm:text-lg font-black tracking-wider break-all">{invoice.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => {
                  setInvoice(null);
                  setFile(null);
                  if (initialInv) window.history.replaceState({}, '', '/bukti-bayar'); 
                }} 
                className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors shrink-0 ml-4"
              >
                Ganti
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-8 pb-6 border-b border-slate-100">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ditagihkan Kepada</p>
                <p className="text-lg sm:text-xl font-black text-slate-800 leading-tight">{invoice.customerName}</p>
                
                <div className="mt-5 flex items-center justify-between bg-indigo-50/50 p-4 sm:p-5 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Sisa Pembayaran</p>
                    <p className="text-2xl font-black text-indigo-700 leading-none">{formatRupiah(invoice.remainingAmount ?? invoice.totalAmount ?? 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-soft">
                    <Receipt className="w-6 h-6 text-indigo-500" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Nominal Transfer (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">Rp</span>
                    <input 
                      type="number" 
                      min="1"
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl font-black text-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                      placeholder="0"
                      required 
                    />
                  </div>
                  {Number(amount) > (invoice.remainingAmount ?? invoice.totalAmount ?? 0) && (
                    <p className="text-[11px] font-bold text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0"/> Nominal melebihi sisa tagihan.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Unggah Struk / Bukti Transfer
                  </label>
                  <div className={`relative border-2 border-dashed rounded-2xl transition-all group ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-indigo-300'}`}>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, application/pdf" 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      required 
                    />
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[140px]">
                      {file ? (
                        <div className="animate-in zoom-in-95 duration-300">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-soft mx-auto">
                            <FileImage className="w-6 h-6 text-indigo-500" />
                          </div>
                          <p className="text-sm font-black text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti file
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-soft mx-auto group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Pilih Dokumen atau Tarik ke Sini</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">Mendukung format JPG, PNG, atau PDF (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !file || !amount}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2 group"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Mengunggah...</>
                  ) : (
                    <>Kirim Konfirmasi Bayar <CheckCircle className="w-5 h-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="search" 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-lg mx-auto public-card p-8 sm:p-10 text-center"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-soft">
               <Receipt className="w-8 h-8" />
            </div>
            
            <label className="block text-base font-black text-slate-800 mb-2">Pencarian Nomor Tagihan</label>
            <p className="text-xs text-slate-500 mb-6">Masukkan Nomor Invoice resmi yang tertera pada dokumen penagihan Anda.</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Cth: INV/UMUM/2026..." 
                className="flex-1 px-5 py-3.5 bg-slate-50 border-0 rounded-xl font-mono text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center sm:text-left shadow-inner"
              />
              <button 
                onClick={() => handleSearch()} 
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-70 transition-colors flex items-center justify-center font-bold text-sm shadow-md"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cari Data'}
              </button>
            </div>
            
            {searchError && (
              <div className="mt-5 p-4 bg-rose-50 rounded-xl flex items-start gap-3 text-left animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-[11px] font-bold text-rose-700 leading-relaxed">{searchError}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-slate-300">
               <Building className="w-5 h-5" />
               <CreditCard className="w-5 h-5" />
               <Receipt className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionContainer>
  );
}

export default function BuktiBayarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <BuktiBayarContent />
    </Suspense>
  );
}