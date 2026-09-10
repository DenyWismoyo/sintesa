// Lokasi file: src/app/billing/component/TabReconciliation.tsx
'use client';

import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, ArrowRightLeft, Database } from 'lucide-react';
import { Journal, formatRupiah } from '@/types';

interface Props {
  journals: Journal[];
  onReconcile: (journalId: string) => Promise<void>;
}

export default function TabReconciliation({ journals, onReconcile }: Props) {
  const [isUploaded, setIsUploaded] = useState(false);
  
  // Ambil jurnal yang melibatkan Kas/Bank dan belum direkonsiliasi
  const cashJournals = journals.filter(j => 
    j.entries.some(e => ['DEBIT', 'KREDIT'].includes(e.type)) && !(j as any).isReconciled
  );

  const handleMockUpload = () => {
    // Simulasi pembacaan CSV Bank
    setIsUploaded(true);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in p-6">
      <div className="bg-gradient-to-br from-indigo-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <p className="text-indigo-300 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4"/> Fitur ERP Lanjutan
          </p>
          <h2 className="text-3xl font-black mb-2">Rekonsiliasi Bank Otomatis</h2>
          <p className="text-indigo-100 text-sm leading-relaxed">Cocokkan (Match) catatan jurnal di sistem dengan Rekening Koran/Mutasi fisik dari bank Anda. Cegah kecurangan dan pastikan integritas laporan kas secara mutlak.</p>
        </div>
        <ArrowRightLeft className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 transform -rotate-12" />
      </div>

      {!isUploaded ? (
        <div className="border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer group" onClick={handleMockUpload}>
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <FileSpreadsheet className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Unggah Mutasi Bank (CSV)</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">Unduh laporan mutasi rekening dari KlikBCA, Mandiri, atau Bank Jateng dalam format .CSV lalu unggah ke sini.</p>
          <button className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700"><UploadCloud className="w-4 h-4"/> Pilih File Mutasi .CSV</button>
        </div>
      ) : (
        <div>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">Hasil Pencocokan AI (Match)</h3>
              <button onClick={() => setIsUploaded(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800 underline">Unggah File Lain</button>
           </div>
           
           <div className="grid grid-cols-2 gap-8 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2"></div>
              
              {/* Sisi Kiri: Data Bank Fisik (Simulasi Hasil CSV) */}
              <div>
                 <div className="bg-slate-800 text-white px-4 py-3 rounded-t-xl font-bold text-sm uppercase tracking-wider">💳 Data Rekening Koran (Bank Fisik)</div>
                 <div className="border border-slate-200 border-t-0 rounded-b-xl overflow-hidden bg-white">
                    {/* Data Simulasi Mock */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                       <div>
                          <p className="text-[11px] text-slate-500 font-bold mb-1">01 Mar 2026</p>
                          <p className="font-bold text-slate-800">TRF IN - Sewa Gedung Pameran</p>
                       </div>
                       <p className="font-black text-emerald-600">Rp 5.000.000</p>
                    </div>
                 </div>
              </div>

              {/* Sisi Kanan: Data Jurnal Sistem Kita */}
              <div>
                 <div className="bg-blue-600 text-white px-4 py-3 rounded-t-xl font-bold text-sm uppercase tracking-wider">💻 Catatan Jurnal (Sistem BLUD)</div>
                 <div className="border border-slate-200 border-t-0 rounded-b-xl overflow-hidden bg-white">
                    {cashJournals.slice(0, 1).map(j => (
                       <div key={j.id} className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
                         <div>
                            <p className="text-[11px] text-slate-500 font-bold mb-1">{j.date}</p>
                            <p className="font-bold text-slate-800 truncate max-w-[200px]">{j.description}</p>
                         </div>
                         <div className="text-right flex flex-col items-end">
                            <p className="font-black text-blue-600">{formatRupiah(j.entries[0].amount)}</p>
                            <button onClick={() => onReconcile(j.id!)} className="mt-2 text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors">
                              <CheckCircle className="w-3 h-3"/> MATCH COCOK
                            </button>
                         </div>
                       </div>
                    ))}
                    {cashJournals.length === 0 && (
                       <div className="p-8 text-center text-slate-400 font-medium text-sm">Tidak ada jurnal kas tertunda yang perlu direkonsiliasi.</div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}