// Lokasi file: src/app/billing/component/TabLaporanAlokasi.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { FileText, Calendar, TrendingUp, TrendingDown, Search, Filter, ArrowDownUp, Network } from 'lucide-react';
import { Invoice, Expense, Account } from '@/types';

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  accounts: Account[];
}

export default function TabLaporanAlokasi({ invoices, expenses, accounts }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  // Fungsi utilitas membaca timestamp transaksi terakhir ke format "YYYY-MM"
  const getTransactionMonth = (timestamp?: number, fallbackDate?: string) => {
    if (timestamp) {
      const d = new Date(timestamp);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (fallbackDate) return fallbackDate.substring(0, 7); // Extract YYYY-MM dari format string YYYY-MM-DD
    return '';
  };

  // Fungsi utilitas mengonversi tanggal untuk tabel
  const getDisplayDate = (timestamp?: number, fallbackDate?: string) => {
    if (timestamp) return new Date(timestamp).toISOString().split('T')[0];
    return fallbackDate || '-';
  };

  const combinedData = useMemo(() => {
    let data: any[] = [];

    invoices.forEach(inv => {
      // PERBAIKAN: Gunakan updatedAt sebagai dasar waktu bulan laporan
      const txMonth = getTransactionMonth(inv.updatedAt, inv.date);
      
      if (inv.status === 'PAID' && inv.isAllocated && txMonth === selectedMonth) {
        data.push({
          id: inv.id,
          date: getDisplayDate(inv.updatedAt, inv.date),
          type: 'INCOME',
          reference: inv.invoiceNumber,
          party: inv.customerName,
          description: inv.items?.[0]?.description || 'Pendapatan Invoice',
          coaName: inv.allocatedCoaName || 'Tidak Diketahui',
          amount: inv.paidAmount
        });
      }
    });

    expenses.forEach(exp => {
      // PERBAIKAN: Gunakan updatedAt (saat disetujui/dibayar) sebagai dasar waktu
      const txMonth = getTransactionMonth(exp.updatedAt, exp.date);

      if (['APPROVED', 'PAID'].includes(exp.status) && txMonth === selectedMonth) {
        data.push({
          id: exp.id,
          date: getDisplayDate(exp.updatedAt, exp.date),
          type: 'EXPENSE',
          reference: exp.expenseNumber,
          party: exp.payeeName,
          description: exp.description,
          coaName: exp.categoryName,
          amount: exp.amount
        });
      }
    });

    if (filterType !== 'ALL') {
      data = data.filter(d => d.type === filterType);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      data = data.filter(d => 
        d.reference.toLowerCase().includes(term) || 
        d.party.toLowerCase().includes(term) || 
        d.coaName.toLowerCase().includes(term)
      );
    }

    // Urutkan berdasarkan tanggal terbaru ke terlama
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, expenses, selectedMonth, filterType, searchTerm]);

  const totalIncome = combinedData.filter(d => d.type === 'INCOME').reduce((sum, d) => sum + d.amount, 0);
  const totalExpense = combinedData.filter(d => d.type === 'EXPENSE').reduce((sum, d) => sum + d.amount, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <div className="flex flex-col w-full animate-in fade-in p-6 bg-slate-50/50">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rekapitulasi Alokasi</h2>
          <p className="text-sm text-slate-500 mt-1">Laporan realisasi pendapatan dan beban berdasarkan Bagan Akun Standar.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="pr-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode Bulan</p>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm font-black text-slate-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><TrendingUp className="w-7 h-7" /></div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pendapatan</p>
             <p className="text-2xl font-black text-slate-800">{formatRupiah(totalIncome)}</p>
           </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0"><TrendingDown className="w-7 h-7" /></div>
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pengeluaran</p>
             <p className="text-2xl font-black text-slate-800">{formatRupiah(totalExpense)}</p>
           </div>
        </div>
        <div className={`p-6 rounded-3xl shadow-sm flex items-center gap-5 text-white ${netFlow >= 0 ? 'bg-gradient-to-br from-indigo-600 to-blue-700' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
           <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><ArrowDownUp className="w-7 h-7" /></div>
           <div>
             <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">{netFlow >= 0 ? 'Surplus (Net)' : 'Defisit (Net)'}</p>
             <p className="text-2xl font-black">{formatRupiah(Math.abs(netFlow))}</p>
           </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari referensi, pihak, atau nama BAS..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer">
            <option value="ALL">Semua Transaksi</option>
            <option value="INCOME">Hanya Pendapatan (Masuk)</option>
            <option value="EXPENSE">Hanya Pengeluaran (Keluar)</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
            <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4 w-32">Tanggal</th>
                <th className="px-6 py-4">Tipe & Referensi</th>
                <th className="px-6 py-4">Klien / Vendor</th>
                <th className="px-6 py-4">Pemetaan Akun (BAS)</th>
                <th className="px-6 py-4 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Network className="w-6 h-6 text-slate-300"/>
                    </div>
                    <p className="font-bold text-slate-600 text-base">Tidak ada data alokasi</p>
                    <p className="text-sm mt-1">Pastikan ada invoice lunas yang sudah di-mapping atau pengeluaran di bulan ini.</p>
                  </td>
                </tr>
              ) : (
                combinedData.map((item, idx) => (
                  <tr key={`${item.type}-${item.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-500 align-top">{item.date}</td>
                    
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2 mb-1.5">
                        {item.type === 'INCOME' ? (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded uppercase tracking-wider">Pendapatan</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-700 rounded uppercase tracking-wider">Pengeluaran</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 text-xs">{item.reference}</p>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-slate-800">{item.party}</p>
                      <p className="text-[11px] text-slate-500 max-w-[200px] truncate mt-1" title={item.description}>{item.description}</p>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Network className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[250px]" title={item.coaName}>{item.coaName}</span>
                      </div>
                    </td>

                    <td className={`px-6 py-4 text-right align-top font-black text-base ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'INCOME' ? '+' : '-'} {formatRupiah(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}