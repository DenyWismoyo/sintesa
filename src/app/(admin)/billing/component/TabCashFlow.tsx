// Lokasi file: src/app/billing/component/TabCashFlow.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Invoice, Expense, Account } from '@/types';
import { 
  ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, 
  Activity, Info, Calendar, Download, FileText
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  accounts: Account[]; // PROPS BARU: Data Bagan Akun Standar (BAS)
}

export default function TabCashFlow({ invoices, expenses, accounts }: Props) {
  const [period, setPeriod] = useState<'ALL' | 'THIS_YEAR' | 'THIS_MONTH' | 'LAST_MONTH'>('THIS_MONTH');

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const cashFlowData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); 
    let endDate = new Date();

    if (period === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    let beginningBalance = 0; 
    
    // Objek Dinamis untuk menampung rincian berdasarkan BAS
    const opInflows: Record<string, number> = {};
    const opOutflows: Record<string, number> = {};
    const invOutflows: Record<string, number> = {};
    const finOutflows: Record<string, number> = {};

    // 1. Proses Pemasukan dari Invoices (Riwayat Pembayaran SUCCESS)
    invoices.forEach(inv => {
      if (!inv.history) return;
      
      inv.history.forEach((hist: any) => {
        if (hist.status !== 'SUCCESS') return;
        const paymentDate = new Date(hist.date.split(' ')[0] || hist.date);
        
        if (paymentDate < startDate) {
          beginningBalance += hist.amount; 
        } else if (paymentDate >= startDate && paymentDate <= endDate) {
          
          // DINAMIS: Cari nama akun pendapatan berdasarkan alokasi
          let coaName = 'Pendapatan Belum Dialokasikan';
          if (inv.allocatedCoaId || inv.suggestedCoaId) {
             const acc = accounts.find(a => a.id === (inv.allocatedCoaId || inv.suggestedCoaId));
             if (acc) coaName = acc.name;
          }

          opInflows[coaName] = (opInflows[coaName] || 0) + hist.amount;
        }
      });
    });

    // 2. Proses Pengeluaran dari Expenses (Status PAID/APPROVED)
    expenses.forEach(exp => {
      if (exp.status !== 'PAID' && exp.status !== 'APPROVED') return; 
      
      const expDate = new Date(exp.date);
      const amount = exp.amount || 0;
      
      if (expDate < startDate) {
        beginningBalance -= amount; 
      } else if (expDate >= startDate && expDate <= endDate) {
        
        // DINAMIS: Cek tipe akun di Pengaturan Keuangan (BAS)
        const account = accounts.find(a => a.id === exp.categoryId);
        const coaName = account ? account.name : (exp.categoryName || 'Beban Operasional Lainnya');
        const accType = account ? account.type : 'BEBAN';

        // Kelompokkan berdasarkan standarisasi PSAK
        if (accType === 'ASET_TETAP') {
           invOutflows[coaName] = (invOutflows[coaName] || 0) + amount; // Masuk Aktivitas Investasi
        } else if (accType === 'HUTANG') {
           finOutflows[coaName] = (finOutflows[coaName] || 0) + amount; // Masuk Aktivitas Pendanaan (Bayar Hutang)
        } else {
           opOutflows[coaName] = (opOutflows[coaName] || 0) + amount; // Default: Aktivitas Operasi (BEBAN)
        }
      }
    });

    // Kalkulasi Total per Aktivitas
    const totalOpInflow = Object.values(opInflows).reduce((sum, val) => sum + val, 0);
    const totalOpOutflow = Object.values(opOutflows).reduce((sum, val) => sum + val, 0);
    const netOperatingCash = totalOpInflow - totalOpOutflow;

    const totalInvOutflow = Object.values(invOutflows).reduce((sum, val) => sum + val, 0);
    const netInvestingCash = -totalInvOutflow; 

    const totalFinOutflow = Object.values(finOutflows).reduce((sum, val) => sum + val, 0);
    const netFinancingCash = -totalFinOutflow;

    const netCashIncrease = netOperatingCash + netInvestingCash + netFinancingCash;
    const endingBalance = beginningBalance + netCashIncrease;

    return {
      beginningBalance,
      operating: { inflows: opInflows, outflows: opOutflows, net: netOperatingCash },
      investing: { outflows: invOutflows, net: netInvestingCash },
      financing: { outflows: finOutflows, net: netFinancingCash },
      netCashIncrease,
      endingBalance
    };
  }, [invoices, expenses, accounts, period]);

  return (
    <div className="flex flex-col w-full animate-in fade-in">
      
      {/* TOOLBAR KONTROL */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">Laporan Arus Kas (Cash Flow)</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tersinkronisasi dengan BAS</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-slate-700 px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="LAST_MONTH">Bulan Lalu</option>
            <option value="THIS_YEAR">Tahun Ini</option>
            <option value="ALL">Semua Waktu</option>
          </select>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Unduh Laporan
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50">
        
        {/* INFO BANNER */}
        <div className="mb-6 bg-teal-50 border border-teal-100 p-4 rounded-xl flex gap-3 text-sm text-teal-800 leading-relaxed shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-teal-600 mt-0.5" />
          <p>
            Rincian di bawah ini dihasilkan secara otomatis dengan <strong>membaca Kategori Utama (Tipe Akun) pada Bagan Akun Standar (BAS)</strong> yang Anda atur di menu Pengaturan Keuangan.
          </p>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Saldo Awal Kas</p>
            <p className="text-xl font-black text-slate-800">{formatRupiah(cashFlowData.beginningBalance)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Activity className="w-3.5 h-3.5"/> Kas Bersih Operasi</p>
            <p className={`text-xl font-black ${cashFlowData.operating.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatRupiah(cashFlowData.operating.net)}</p>
          </div>

          <div className={`p-4 rounded-2xl border shadow-sm ${cashFlowData.netCashIncrease >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1 ${cashFlowData.netCashIncrease >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {cashFlowData.netCashIncrease >= 0 ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>}
              {cashFlowData.netCashIncrease >= 0 ? 'Kenaikan Bersih Kas' : 'Penurunan Bersih Kas'}
            </p>
            <p className={`text-xl font-black ${cashFlowData.netCashIncrease >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatRupiah(cashFlowData.netCashIncrease)}</p>
          </div>

          <div className="bg-teal-600 p-4 rounded-2xl border border-teal-700 shadow-sm text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full"></div>
            <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mb-1.5 flex items-center gap-1 relative z-10"><DollarSign className="w-3.5 h-3.5"/> Saldo Akhir Kas</p>
            <p className="text-2xl font-black relative z-10">{formatRupiah(cashFlowData.endingBalance)}</p>
          </div>
        </div>

        {/* STATEMENT TABLE DYNAMIC */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-xs w-3/4"><FileText className="w-4 h-4 inline-block mr-2 -mt-1"/> Keterangan Aktivitas</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-xs text-right w-1/4">Nilai (IDR)</th>
              </tr>
            </thead>
            <tbody>
              
              {/* ======================================= */}
              {/* 1. AKTIVITAS OPERASI */}
              {/* ======================================= */}
              <tr className="bg-blue-50/80 border-b border-slate-200">
                <td colSpan={2} className="px-6 py-3 font-black text-blue-900 text-[11px] uppercase tracking-wider">I. Arus Kas Dari Aktivitas Operasi</td>
              </tr>
              
              {/* Penerimaan Operasi */}
              <tr className="bg-slate-50 border-y border-slate-100"><td colSpan={2} className="px-6 py-2 text-[11px] font-bold text-slate-500 pl-10 uppercase">Arus Kas Masuk (Penerimaan)</td></tr>
              {Object.entries(cashFlowData.operating.inflows).map(([name, amount], idx) => (
                <tr key={`opi-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-2.5 text-slate-700 pl-14 flex items-center gap-2">Penerimaan: {name}</td>
                  <td className="px-6 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(amount)}</td>
                </tr>
              ))}
              {Object.keys(cashFlowData.operating.inflows).length === 0 && (
                <tr><td colSpan={2} className="px-6 py-3 text-slate-400 italic pl-14 text-xs">Tidak ada transaksi tercatat.</td></tr>
              )}

              {/* Pengeluaran Operasi */}
              <tr className="bg-slate-50 border-y border-slate-100"><td colSpan={2} className="px-6 py-2 text-[11px] font-bold text-slate-500 pl-10 uppercase">Arus Kas Keluar (Pembayaran Beban)</td></tr>
              {Object.entries(cashFlowData.operating.outflows).map(([name, amount], idx) => (
                <tr key={`opo-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-2.5 text-slate-700 pl-14">Pembayaran: {name}</td>
                  <td className="px-6 py-2.5 text-right font-semibold text-red-600">({formatRupiah(amount)})</td>
                </tr>
              ))}
              {Object.keys(cashFlowData.operating.outflows).length === 0 && (
                <tr><td colSpan={2} className="px-6 py-3 text-slate-400 italic pl-14 text-xs">Tidak ada transaksi tercatat.</td></tr>
              )}

              {/* Net Operasi */}
              <tr className="bg-blue-50/50">
                <td className="px-6 py-3.5 font-bold text-blue-800 text-xs pl-10">Kas Bersih yang Diperoleh (Digunakan) untuk Aktivitas Operasi</td>
                <td className="px-6 py-3.5 text-right font-black text-blue-700 text-base">{formatRupiah(cashFlowData.operating.net)}</td>
              </tr>

              {/* ======================================= */}
              {/* 2. AKTIVITAS INVESTASI */}
              {/* ======================================= */}
              <tr className="bg-purple-50/80 border-b border-slate-200 border-t border-slate-300">
                <td colSpan={2} className="px-6 py-3 font-black text-purple-900 text-[11px] uppercase tracking-wider">II. Arus Kas Dari Aktivitas Investasi</td>
              </tr>
              
              {/* Pengeluaran Investasi (Beli Aset) */}
              {Object.entries(cashFlowData.investing.outflows).map(([name, amount], idx) => (
                <tr key={`invo-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-2.5 text-slate-700 pl-10">Perolehan (Pembelian): {name}</td>
                  <td className="px-6 py-2.5 text-right font-semibold text-red-600">({formatRupiah(amount)})</td>
                </tr>
              ))}
              {Object.keys(cashFlowData.investing.outflows).length === 0 && (
                <tr><td colSpan={2} className="px-6 py-3 text-slate-400 italic pl-10 text-xs">Tidak ada pengeluaran aset tetap tercatat.</td></tr>
              )}

              <tr className="bg-purple-50/50">
                <td className="px-6 py-3.5 font-bold text-purple-800 text-xs pl-10">Kas Bersih yang Diperoleh (Digunakan) untuk Aktivitas Investasi</td>
                <td className="px-6 py-3.5 text-right font-black text-purple-700 text-base">{formatRupiah(cashFlowData.investing.net)}</td>
              </tr>

              {/* ======================================= */}
              {/* 3. AKTIVITAS PENDANAAN */}
              {/* ======================================= */}
              <tr className="bg-orange-50/80 border-b border-slate-200 border-t border-slate-300">
                <td colSpan={2} className="px-6 py-3 font-black text-orange-900 text-[11px] uppercase tracking-wider">III. Arus Kas Dari Aktivitas Pendanaan</td>
              </tr>
              
              {/* Pengeluaran Pendanaan (Bayar Hutang) */}
              {Object.entries(cashFlowData.financing.outflows).map(([name, amount], idx) => (
                <tr key={`fino-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-2.5 text-slate-700 pl-10">Pembayaran Hutang/Kewajiban: {name}</td>
                  <td className="px-6 py-2.5 text-right font-semibold text-red-600">({formatRupiah(amount)})</td>
                </tr>
              ))}
              {Object.keys(cashFlowData.financing.outflows).length === 0 && (
                <tr><td colSpan={2} className="px-6 py-3 text-slate-400 italic pl-10 text-xs">Tidak ada pembayaran hutang tercatat.</td></tr>
              )}

              <tr className="bg-orange-50/50">
                <td className="px-6 py-3.5 font-bold text-orange-800 text-xs pl-10">Kas Bersih yang Diperoleh (Digunakan) untuk Aktivitas Pendanaan</td>
                <td className="px-6 py-3.5 text-right font-black text-orange-700 text-base">{formatRupiah(cashFlowData.financing.net)}</td>
              </tr>

              {/* ======================================= */}
              {/* REKAPITULASI AKHIR */}
              {/* ======================================= */}
              <tr><td colSpan={2} className="h-4 bg-slate-50 border-t border-slate-300"></td></tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-black uppercase tracking-widest text-slate-800">Kenaikan (Penurunan) Bersih Kas dan Setara Kas</td>
                <td className={`px-6 py-4 text-right font-black text-lg ${cashFlowData.netCashIncrease >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(cashFlowData.netCashIncrease)}</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-600">Saldo Kas dan Setara Kas Awal Periode</td>
                <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRupiah(cashFlowData.beginningBalance)}</td>
              </tr>
              <tr className="bg-teal-600 text-white shadow-md relative z-10">
                <td className="px-6 py-5 font-black uppercase tracking-widest text-sm">Saldo Kas dan Setara Kas Akhir Periode</td>
                <td className="px-6 py-5 text-right font-black text-2xl">{formatRupiah(cashFlowData.endingBalance)}</td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}