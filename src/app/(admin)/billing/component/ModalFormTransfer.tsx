// Lokasi file: src/app/billing/component/ModalFormTransfer.tsx
'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Loader2, Landmark } from 'lucide-react';
import { Account, formatRupiah } from '@/types';

interface Props {
  accounts: Account[];
  onClose: () => void;
  onSubmit: (sourceId: string, sourceName: string, destId: string, destName: string, amount: number, note: string, date: string) => Promise<void>;
}

export default function ModalFormTransfer({ accounts, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const cashAccounts = accounts.filter(a => a.type === 'KAS_BANK');

  const [formData, setFormData] = useState({
    sourceId: cashAccounts[0]?.id || '',
    destId: cashAccounts.length > 1 ? cashAccounts[1].id : '',
    amount: '',
    note: 'Transfer saldo operasional',
    date: new Date().toISOString().split('T')[0],
  });

  const sourceAccount = cashAccounts.find(a => a.id === formData.sourceId);
  const destAccount = cashAccounts.find(a => a.id === formData.destId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceAccount || !destAccount) return alert("Pilih akun sumber dan tujuan");
    if (sourceAccount.id === destAccount.id) return alert("Akun sumber dan tujuan tidak boleh sama");
    if (Number(formData.amount) <= 0) return alert("Nominal transfer tidak valid");
    if ((sourceAccount.balance || 0) < Number(formData.amount)) return alert("Saldo sumber tidak mencukupi");

    setLoading(true);
    await onSubmit(
      sourceAccount.id!, sourceAccount.name, 
      destAccount.id!, destAccount.name, 
      Number(formData.amount), formData.note, formData.date
    );
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClass = "text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between z-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Mutasi Antar Kas</h2>
              <p className="text-xs font-medium text-blue-100 mt-1">Pindah dana antar rekening internal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-4">
            <div>
              <label className={labelClass}>Tarik Dana Dari (Sumber)</label>
              <select required value={formData.sourceId} onChange={e => setFormData({...formData, sourceId: e.target.value})} className={inputClass}>
                {cashAccounts.map(a => <option key={`src-${a.id}`} value={a.id}>{a.name} (Saldo: {formatRupiah(a.balance || 0)})</option>)}
              </select>
            </div>
            
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10 text-slate-400">
               <ArrowRightLeft className="w-4 h-4 rotate-90" />
            </div>

            <div className="pt-2">
              <label className={labelClass}>Setor Ke (Tujuan)</label>
              <select required value={formData.destId} onChange={e => setFormData({...formData, destId: e.target.value})} className={inputClass}>
                <option value="">-- Pilih Tujuan --</option>
                {cashAccounts.filter(a => a.id !== formData.sourceId).map(a => <option key={`dst-${a.id}`} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className={labelClass}>Nominal Transfer (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                  <input type="number" required min="1" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-2xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
             </div>
             <div>
                <label className={labelClass}>Tanggal</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClass} />
             </div>
             <div>
                <label className={labelClass}>Keterangan</label>
                <input type="text" required value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className={inputClass} placeholder="Alasan mutasi..." />
             </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 mt-4">
            {loading ? <><Loader2 className="animate-spin w-5 h-5"/> Memproses Mutasi...</> : 'Proses Mutasi Kas'}
          </button>
        </form>

      </div>
    </div>
  );
}