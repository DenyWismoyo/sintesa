import React, { useState } from 'react';
import { TrendingUp, Clock, AlertCircle, Building, BookOpen, Store, PieChart, Loader2, ArrowUpRight, Edit2, Check, X } from 'lucide-react';
import { Invoice } from '@/types';

interface StatCardProps {
  invoices: Invoice[];
  loading?: boolean;
  targetPAD: number;
  onUpdateTargetPAD: (val: number) => void;
}

export default function StatCardBilling({ invoices, loading, targetPAD, onUpdateTargetPAD }: StatCardProps) {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetPAD);

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const totalPendapatan = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  
  const totalPiutang = invoices.reduce((sum, inv) => {
    if (['PENDING', 'PARTIAL', 'OVERDUE'].includes(inv.status)) {
      return sum + (Number(inv.remainingAmount) || 0);
    }
    return sum;
  }, 0);
  
  const invoiceTertunda = invoices.filter(inv => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(inv.status)).length;

  let kasFasilitas = 0, kasPelatihan = 0, kasTenant = 0, kasKatalog = 0, kasLainnya = 0;

  invoices.forEach(inv => {
    const safePaidAmount = Number(inv.paidAmount) || 0;
    const safeTotalAmount = Number(inv.totalAmount) || 0;

    if (safePaidAmount > 0) {
      const ratio = safeTotalAmount > 0 ? (safePaidAmount / safeTotalAmount) : 0;
      
      if (Array.isArray(inv.items)) {
        inv.items.forEach(item => {
          const safeItemTotal = Number(item.total) || 0;
          const paidValue = safeItemTotal * ratio;
          
          switch (item.referenceType) {
            case 'BOOKING':
            case 'TARIFF_DAY': kasFasilitas += paidValue; break;
            case 'TRAINING': kasPelatihan += paidValue; break;
            case 'TARIFF_MONTH': kasTenant += paidValue; break;
            case 'CATALOG': kasKatalog += paidValue; break;
            default: kasLainnya += paidValue;
          }
        });
      }
    }
  });

  const targetPercentage = targetPAD > 0 ? Math.min(100, (totalPendapatan / targetPAD) * 100) : 0;

  const handleSaveTarget = () => {
    if (tempTarget > 0) {
      onUpdateTargetPAD(tempTarget);
      setIsEditingTarget(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 3 STATS UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KARTU PENDAPATAN DENGAN TARGET DINAMIS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              Total PAD
              {!isEditingTarget && (
                <button onClick={() => setIsEditingTarget(true)} className="text-slate-300 hover:text-blue-500 transition-colors" title="Ubah Target PAD">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </p>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm"><TrendingUp className="w-5 h-5" /></div>
          </div>
          
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatRupiah(totalPendapatan)}</h3>
          
          {/* LOGIKA EDIT TARGET PAD */}
          {isEditingTarget ? (
            <div className="mt-4 flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 animate-in fade-in">
              <span className="text-xs font-bold text-slate-400 pl-2">Rp</span>
              <input 
                type="number" 
                value={tempTarget} 
                onChange={(e) => setTempTarget(Number(e.target.value))} 
                className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                autoFocus
              />
              <button onClick={handleSaveTarget} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-3 h-3"/></button>
              <button onClick={() => setIsEditingTarget(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-3 h-3"/></button>
            </div>
          ) : (
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${targetPercentage}%` }}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-bold text-emerald-600">{targetPercentage.toFixed(1)}% Tercapai</p>
                <p className="text-[10px] font-bold text-slate-400">Target: {formatRupiah(targetPAD)}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Piutang</p>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm"><PieChart className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatRupiah(totalPiutang)}</h3>
          <p className="text-xs font-bold text-amber-600 mt-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Clock className="w-3.5 h-3.5"/> Menunggu Pelunasan
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tagihan Aktif</p>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm"><AlertCircle className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{invoiceTertunda} <span className="text-base font-semibold text-slate-400">Berkas</span></h3>
          <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
             <AlertCircle className="w-3.5 h-3.5"/> Perlu Follow-up
          </p>
        </div>
      </div>

      {/* DISTRIBUSI PENDAPATAN */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-5">Distribusi Sumber Pendapatan Terbayar</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1.5">
              <Building className="w-4 h-4 text-indigo-500" /> Sewa Fasilitas
            </div>
            <p className="text-lg font-black text-slate-800">{formatRupiah(kasFasilitas)}</p>
          </div>

          <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" /> Pelatihan/LMS
            </div>
            <p className="text-lg font-black text-slate-800">{formatRupiah(kasPelatihan)}</p>
          </div>

          <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1.5">
              <Store className="w-4 h-4 text-amber-500" /> Sewa Tenant
            </div>
            <p className="text-lg font-black text-slate-800">{formatRupiah(kasTenant + kasKatalog)}</p>
          </div>

          <div className="flex flex-col bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1.5">
              <TrendingUp className="w-4 h-4 text-slate-400" /> Sumber Lain
            </div>
            <p className="text-lg font-black text-slate-800">{formatRupiah(kasLainnya)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}