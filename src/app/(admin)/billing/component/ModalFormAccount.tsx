// Lokasi file: src/app/billing/component/ModalFormAccount.tsx
'use client';

import React, { useState } from 'react';
import { X, Landmark, Loader2, CreditCard } from 'lucide-react';
import { Account } from '@/types';

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Account, 'id'>) => Promise<void>;
}

export default function ModalFormAccount({ onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'KAS_BANK',
    balance: '0',
    // State baru untuk Bank
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isReceivingAccount: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await onSubmit({
      code: formData.code,
      name: formData.name,
      type: formData.type as any,
      balance: formData.type === 'KAS_BANK' ? Number(formData.balance) : 0,
      isSystem: false,
      parentId: null,
      level: 1,
      accountBehavior: 'TRANSACTION',
      // Payload bank dikirim jika tipe KAS_BANK
      ...(formData.type === 'KAS_BANK' && {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        isReceivingAccount: formData.isReceivingAccount
      })
    });
    
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClass = "text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-black text-slate-800">Tambah Akun Baru</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="accountForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Kategori Akun</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputClass}>
                <option value="KAS_BANK">Kas & Bank (Aktiva Lancar)</option>
                <option value="BEBAN">Beban & Biaya (Pengeluaran)</option>
                <option value="PENDAPATAN">Pendapatan (Pemasukan Lain)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Nama Akun Pembukuan</label>
                <input type="text" required placeholder="Cth: Bank Mandiri Operasional" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Kode Buku Besar</label>
                <input type="text" required placeholder="Cth: 1-1002" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className={inputClass} />
              </div>
              {formData.type === 'KAS_BANK' && (
                <div>
                  <label className={labelClass}>Saldo Awal</label>
                  <input type="number" min="0" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} className={inputClass} />
                </div>
              )}
            </div>

            {/* FORM TAMBAHAN KHUSUS KAS & BANK */}
            {formData.type === 'KAS_BANK' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-800">Pengaturan Rekening Bank</h3>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Nama Bank</label>
                  <input type="text" placeholder="Cth: Bank Jateng Cabang X" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Nomor Rekening</label>
                  <input type="text" placeholder="Cth: 1-034-56789-0" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-blue-500" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">Atas Nama (A.N)</label>
                  <input type="text" placeholder="Cth: BLUD Solo Technopark" value={formData.accountHolder} onChange={e => setFormData({...formData, accountHolder: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>

                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                  <input type="checkbox" checked={formData.isReceivingAccount} onChange={e => setFormData({...formData, isReceivingAccount: e.target.checked})} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-xs font-bold text-slate-700">Jadikan Rekening Utama di Invoice Publik</span>
                </label>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button type="submit" form="accountForm" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : 'Simpan Akun'}
          </button>
        </div>
      </div>
    </div>
  );
}