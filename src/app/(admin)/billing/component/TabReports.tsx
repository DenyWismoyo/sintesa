// Lokasi file: src/app/billing/component/TabReports.tsx
'use client';

import React, { useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, BookOpen, Clock, FileText, Scale, RefreshCcw, Download } from 'lucide-react';
import { Journal, Account, Invoice, Expense } from '@/types';

interface Props {
  journals: Journal[];
  accounts: Account[];
  invoices: Invoice[]; // Tambahan Prop untuk menghitung Piutang di Neraca
  expenses: Expense[]; // Tambahan Prop untuk menghitung Hutang di Neraca
}

export default function TabReports({ journals, accounts, invoices, expenses }: Props) {
  const [activeReport, setActiveReport] = useState<'LABA_RUGI' | 'NERACA' | 'ARUS_KAS'>('LABA_RUGI');

  const formatRupiah = (number: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  // --- 1. KALKULASI LABA/RUGI (PROFIT & LOSS) ---
  const incomeAccountIds = accounts.filter(a => a.type === 'PENDAPATAN').map(a => a.id);
  const expenseAccountIds = accounts.filter(a => a.type === 'BEBAN').map(a => a.id);

  let totalIncome = 0;
  let totalExpense = 0;

  journals.forEach(journal => {
    journal.entries.forEach(entry => {
      if (entry.type === 'KREDIT' && incomeAccountIds.includes(entry.accountId)) totalIncome += entry.amount;
      if (entry.type === 'DEBIT' && expenseAccountIds.includes(entry.accountId)) totalExpense += entry.amount;
    });
  });

  const netProfit = totalIncome - totalExpense;

  // --- 2. KALKULASI NERACA (BALANCE SHEET) ---
  // AKTIVA (Harta)
  const totalKasBank = accounts.filter(a => a.type === 'KAS_BANK').reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalPiutang = invoices.filter(i => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalAktiva = totalKasBank + totalPiutang;

  // PASIVA (Kewajiban & Modal)
  const totalHutang = expenses.filter(e => ['PENDING_APPROVAL', 'APPROVED'].includes(e.status)).reduce((sum, e) => sum + e.amount, 0);
  // Modal awal dianggap 0, ditambah Laba Bersih tahun berjalan
  const totalModal = netProfit; 
  // Formula Neraca: Pasiva penyeimbang (Karena ini sistem sederhana, selisih dimasukkan ke Modal Penyeimbang)
  const modalPenyeimbang = totalAktiva - (totalHutang + totalModal);

  // --- 3. KALKULASI ARUS KAS (CASH FLOW) ---
  let cashInflow = 0;
  let cashOutflow = 0;
  
  journals.forEach(journal => {
    if (journal.referenceType === 'INVOICE') cashInflow += journal.entries.find(e => e.type === 'DEBIT')?.amount || 0;
    if (journal.referenceType === 'EXPENSE') cashOutflow += journal.entries.find(e => e.type === 'KREDIT')?.amount || 0;
  });
  const netCashFlow = cashInflow - cashOutflow;

  return (
    <div className="flex flex-col w-full animate-in fade-in">
      
      {/* SUB-NAVIGASI LAPORAN */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-4 gap-6">
        <button onClick={() => setActiveReport('LABA_RUGI')} className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeReport === 'LABA_RUGI' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <PieChart className="w-4 h-4" /> Laba / Rugi (P&L)
        </button>
        <button onClick={() => setActiveReport('NERACA')} className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeReport === 'NERACA' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Scale className="w-4 h-4" /> Neraca (Balance Sheet)
        </button>
        <button onClick={() => setActiveReport('ARUS_KAS')} className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeReport === 'ARUS_KAS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <RefreshCcw className="w-4 h-4" /> Arus Kas (Cash Flow)
        </button>
      </div>

      <div className="p-6">
        {/* VIEW: LABA RUGI */}
        {activeReport === 'LABA_RUGI' && (
          <div className="animate-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Pendapatan Operasional</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                  <h4 className="text-2xl font-black text-slate-800">{formatRupiah(totalIncome)}</h4>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Beban Operasional</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><TrendingDown className="w-5 h-5" /></div>
                  <h4 className="text-2xl font-black text-slate-800">{formatRupiah(totalExpense)}</h4>
                </div>
              </div>
              <div className={`${netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between`}>
                <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-2">{netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</p>
                <h4 className="text-3xl font-black">{formatRupiah(Math.abs(netProfit))}</h4>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> Buku Besar (General Ledger)</h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-semibold">
                    <tr><th className="px-6 py-4 w-[15%]">Tanggal</th><th className="px-6 py-4 w-[35%]">Keterangan</th><th className="px-6 py-4">Akun</th><th className="px-6 py-4 text-right text-emerald-600">Debit</th><th className="px-6 py-4 text-right text-red-600">Kredit</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journals.map((journal) => (
                      <React.Fragment key={journal.id}>
                        <tr className="bg-slate-50/50">
                          <td className="px-6 py-4 align-top font-bold text-slate-700">
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {journal.date}</div>
                            <div className="text-[10px] text-slate-400 mt-1 uppercase">{journal.referenceType}</div>
                          </td>
                          <td className="px-6 py-4 align-top font-bold text-slate-800" colSpan={4}>{journal.description}</td>
                        </tr>
                        {journal.entries.map((entry, idx) => (
                          <tr key={`${journal.id}-${idx}`} className="text-[13px]">
                            <td colSpan={2}></td>
                            <td className={`px-6 py-2 font-medium ${entry.type === 'KREDIT' ? 'pl-10 text-slate-600' : 'text-slate-800'}`}>{entry.accountName}</td>
                            <td className="px-6 py-2 text-right font-bold text-slate-800">{entry.type === 'DEBIT' ? formatRupiah(entry.amount) : '-'}</td>
                            <td className="px-6 py-2 text-right font-bold text-slate-800">{entry.type === 'KREDIT' ? formatRupiah(entry.amount) : '-'}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: NERACA (BALANCE SHEET) */}
        {activeReport === 'NERACA' && (
          <div className="animate-in slide-in-from-right-4 max-w-4xl mx-auto">
             <div className="text-center mb-8">
               <h2 className="text-2xl font-black text-slate-800">Laporan Neraca (Balance Sheet)</h2>
               <p className="text-slate-500">Posisi Keuangan Real-time</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* KOLOM AKTIVA */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-6 py-4 text-white font-bold text-lg">AKTIVA (Harta)</div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Kas & Setara Kas</span><span className="font-bold text-slate-900">{formatRupiah(totalKasBank)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Piutang Usaha</span><span className="font-bold text-slate-900">{formatRupiah(totalPiutang)}</span></div>
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center"><span className="text-slate-800 font-black">Total Aktiva</span><span className="font-black text-blue-700 text-lg">{formatRupiah(totalAktiva)}</span></div>
                  </div>
                </div>
                {/* KOLOM PASIVA */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-emerald-600 px-6 py-4 text-white font-bold text-lg">PASIVA (Kewajiban & Modal)</div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Hutang Usaha (YMH Dibayar)</span><span className="font-bold text-slate-900">{formatRupiah(totalHutang)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Laba Ditahan / Berjalan</span><span className="font-bold text-slate-900">{formatRupiah(totalModal)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Modal Penyeimbang</span><span className="font-bold text-slate-900">{formatRupiah(modalPenyeimbang)}</span></div>
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center"><span className="text-slate-800 font-black">Total Pasiva</span><span className="font-black text-emerald-700 text-lg">{formatRupiah(totalHutang + totalModal + modalPenyeimbang)}</span></div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: ARUS KAS (CASH FLOW) */}
        {activeReport === 'ARUS_KAS' && (
          <div className="animate-in slide-in-from-right-4 max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 text-center">
               <h2 className="text-2xl font-black text-slate-800">Laporan Arus Kas</h2>
               <p className="text-slate-500 mt-1">Metode Langsung (Direct Method)</p>
             </div>
             <div className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-sm border-b border-slate-200 pb-2">Aktivitas Operasi</h3>
                  <div className="flex justify-between items-center py-2"><span className="text-slate-600">Penerimaan Kas dari Pelanggan</span><span className="font-bold text-emerald-600">{formatRupiah(cashInflow)}</span></div>
                  <div className="flex justify-between items-center py-2"><span className="text-slate-600">Pembayaran Kas ke Vendor/Beban</span><span className="font-bold text-red-600">({formatRupiah(cashOutflow)})</span></div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-200">
                  <span className="text-slate-800 font-black text-lg">Kenaikan (Penurunan) Kas Bersih</span>
                  <span className={`font-black text-2xl ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(netCashFlow)}</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}