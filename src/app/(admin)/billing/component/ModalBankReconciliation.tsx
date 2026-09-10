// Lokasi file: src/app/billing/component/ModalBankReconciliation.tsx
'use client';

import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Journal, formatRupiah } from '@/types';

interface Props {
  onClose: () => void;
  journals: Journal[];
}

export default function ModalBankReconciliation({ onClose, journals }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan hasil kecocokan (Matching)
  const [matchedItems, setMatchedItems] = useState<any[]>([]);
  const [unmatchedBankItems, setUnmatchedBankItems] = useState<any[]>([]);

  // FUNGSI SIMULASI MENGUNGGAH CSV REKENING KORAN (MOCKING)
  const simulateUploadCSV = () => {
    setLoading(true);
    setTimeout(() => {
      // 1. Ekstrak data jurnal aktual dari sistem (Hanya Kas)
      const systemCashTransactions = journals.map(j => {
        const kasEntry = j.entries.find(e => e.accountName.toLowerCase().includes('kas') || e.accountName.toLowerCase().includes('bank'));
        return {
          date: j.date,
          desc: j.description,
          amount: kasEntry?.amount || 0,
          type: kasEntry?.type === 'DEBIT' ? 'IN' : 'OUT', // Debit Kas = Masuk
          systemRef: j.id
        };
      }).filter(t => t.amount > 0);

      // 2. Simulasi data Bank (Rekening Koran) yang 90% identik dengan sistem
      const mockBankData = [...systemCashTransactions];
      
      // 3. Sistem "AI" pencocokan (Tinder for Finance)
      const matched = [];
      const unmatchedBank = [];

      for (const bankTx of mockBankData) {
        // Cari pasangan di sistem berdasarkan nominal & tanggal
        const match = systemCashTransactions.find(sysTx => sysTx.amount === bankTx.amount && sysTx.type === bankTx.type);
        if (match) matched.push({ bank: bankTx, system: match });
        else unmatchedBank.push(bankTx);
      }

      // Simulasi ada transaksi biaya admin bank yang belum dicatat di sistem
      unmatchedBank.push({ date: new Date().toISOString().split('T')[0], desc: 'BIAYA ADMIN BANK BULANAN', amount: 15000, type: 'OUT' });

      setMatchedItems(matched);
      setUnmatchedBankItems(unmatchedBank);
      setLoading(false);
      setStep(2);
    }, 2000);
  };

  const handleFinish = () => {
    alert("Proses Rekonsiliasi Selesai! Transaksi yang tidak cocok dapat dijurnal secara manual.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-8 py-6 flex items-center justify-between z-10 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">Rekonsiliasi Bank Otomatis</h2>
            <p className="text-sm font-medium text-blue-100 mt-1">Cocokkan Mutasi Rekening Bank dengan Catatan Sistem</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 bg-slate-50">
          
          {step === 1 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-white border-4 border-dashed border-blue-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                 <FileSpreadsheet className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Unggah e-Statement / CSV Bank</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm">
                Unggah file rekening koran (.csv) dari BCA, Mandiri, atau Bank Jateng. Sistem akan otomatis mencocokkan setiap baris transaksi dengan Buku Besar Anda.
              </p>
              <button 
                onClick={simulateUploadCSV} 
                disabled={loading}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all disabled:opacity-70"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> Membaca & Mencocokkan Data...</> : <><UploadCloud className="w-5 h-5"/> Mulai Auto-Match (Simulasi)</>}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in space-y-8">
               {/* KARTU STATISTIK HASIL REKON */}
               <div className="grid grid-cols-2 gap-6">
                 <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
                   <div><p className="text-xs font-bold text-emerald-700 uppercase">Transaksi Cocok (Matched)</p><p className="text-3xl font-black text-emerald-800 mt-1">{matchedItems.length}</p></div>
                   <CheckCircle className="w-10 h-10 text-emerald-400 opacity-50" />
                 </div>
                 <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
                   <div><p className="text-xs font-bold text-amber-700 uppercase">Perlu Perhatian (Unmatched)</p><p className="text-3xl font-black text-amber-800 mt-1">{unmatchedBankItems.length}</p></div>
                   <AlertTriangle className="w-10 h-10 text-amber-400 opacity-50" />
                 </div>
               </div>

               {/* TABEL HASIL MATCHING */}
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                 <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 font-bold text-sm text-slate-700">Hasil Pencocokan (Rekening Bank vs Sistem)</div>
                 <table className="w-full text-sm text-left">
                   <thead className="bg-white border-b border-slate-100 text-xs text-slate-500">
                     <tr><th className="px-6 py-3">Catatan di Rekening Bank</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3">Pencatatan di Sistem ERP</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {unmatchedBankItems.map((item, i) => (
                       <tr key={`unmatch-${i}`} className="bg-amber-50/30">
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{item.desc}</div>
                           <div className={`font-black mt-1 ${item.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(item.amount)}</div>
                         </td>
                         <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold"><AlertTriangle className="w-3 h-3"/> SILUMAN</span></td>
                         <td className="px-6 py-4 text-slate-500 italic text-xs">Sistem tidak memiliki catatan jurnal untuk transaksi ini. Silakan catat manual.</td>
                       </tr>
                     ))}
                     {matchedItems.map((match, i) => (
                       <tr key={`match-${i}`}>
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-700">{match.bank.desc}</div>
                           <div className="text-slate-500 font-medium text-xs mt-1">{formatRupiah(match.bank.amount)}</div>
                         </td>
                         <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold"><CheckCircle className="w-3 h-3"/> COCOK</span></td>
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-700">{match.system.desc}</div>
                           <div className="text-slate-500 font-medium text-xs mt-1">Ref Jurnal Valid</div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>

        {step === 2 && (
          <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
            <button onClick={handleFinish} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-colors">
              Simpan Hasil Rekonsiliasi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}