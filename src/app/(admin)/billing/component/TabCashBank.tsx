// Lokasi Directory: src/app/billing/component/TabCashBank.tsx
import React, { useState } from 'react';
import { Landmark, ArrowRightLeft, Search, CheckCircle2, AlertCircle, Settings, CreditCard, Star } from 'lucide-react';
import { Account } from '@/types';
import Link from 'next/link';

interface Props {
  accounts: Account[];
  onOpenAddAccount?: () => void; 
  onOpenTransfer: () => void;
  onOpenReconciliation: () => void;
}

export default function TabCashBank({ accounts, onOpenAddAccount, onOpenTransfer, onOpenReconciliation }: Props) {
  const [search, setSearch] = useState('');
  
  const cashAccounts = accounts.filter(a => a.type === 'KAS_BANK' && a.accountBehavior !== 'HEADER')
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()));

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const totalBalance = cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="flex flex-col w-full animate-in fade-in p-6 bg-slate-50/50">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kas & Bank Aktif</h2>
          <p className="text-sm text-slate-500 mt-1">Total Saldo: <span className="font-bold text-emerald-600">{formatRupiah(totalBalance)}</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari rekening..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          {onOpenAddAccount && (
            <button onClick={onOpenAddAccount} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors">
              <Landmark className="w-4 h-4" /> Tambah Kas
            </button>
          )}
          <button onClick={onOpenTransfer} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Mutasi/Transfer
          </button>
          <button onClick={onOpenReconciliation} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Rekonsiliasi Bank
          </button>
        </div>
      </div>

      {cashAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cashAccounts.map((acc) => (
            <div key={acc.id} className={`bg-white p-6 rounded-2xl border ${acc.isReceivingAccount ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-slate-200 shadow-sm hover:shadow-md'} transition-all group relative overflow-hidden flex flex-col`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {acc.isSystem && (
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                      <AlertCircle className="w-3 h-3"/> Default Sistem
                    </span>
                  )}
                  {acc.isReceivingAccount && (
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-indigo-200">
                      <Star className="w-3 h-3 fill-indigo-700"/> Rekening Invoice
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-xs font-mono font-bold text-slate-400 mb-1">{acc.code}</p>
                <h3 className="text-base font-black text-slate-800 mb-3">{acc.name}</h3>

                {acc.accountNumber && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{acc.bankName}</p>
                    <p className="text-sm font-mono font-black text-slate-700 flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-400"/> {acc.accountNumber}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1">A.n {acc.accountHolder}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-100 mt-auto">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Tersedia</p>
                <p className="text-2xl font-black text-slate-800">{formatRupiah(acc.balance)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Landmark className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Rekening Aktif</h3>
          <p className="text-slate-500 text-sm max-w-md mb-6">Tambahkan kode rekening tipe Kas & Bank melalui menu Pengaturan &gt; Bagan Akun Standar (BAS).</p>
          {onOpenAddAccount && (
            <button onClick={onOpenAddAccount} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
              <Settings className="w-4 h-4" /> Buka Pengaturan BAS
            </button>
          )}
        </div>
      )}
    </div>
  );
}