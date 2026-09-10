'use client';

import React, { useMemo, useState } from 'react';
import { Invoice, Expense } from '@/types';
import { 
  TrendingUp, TrendingDown, Building, BookOpen, Store, 
  Package, DollarSign, PieChart, Activity, Filter, Info
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
}

export default function TabProfitCenter({ invoices, expenses }: Props) {
  const [reportType, setReportType] = useState<'ACCRUAL' | 'CASH'>('ACCRUAL');
  const [period, setPeriod] = useState<'ALL' | 'THIS_YEAR' | 'THIS_MONTH'>('ALL');

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const data = useMemo(() => {
    let filteredInvoices = invoices.filter(inv => inv.status !== 'CANCELLED');
    let filteredExpenses = expenses.filter(exp => exp.status === 'PAID' || exp.status === 'APPROVED'); // Asumsi hanya yang disetujui/dibayar

    // Filter Periode (Sederhana)
    const now = new Date();
    if (period === 'THIS_YEAR') {
      filteredInvoices = filteredInvoices.filter(inv => new Date(inv.date).getFullYear() === now.getFullYear());
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date).getFullYear() === now.getFullYear());
    } else if (period === 'THIS_MONTH') {
      filteredInvoices = filteredInvoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      filteredExpenses = filteredExpenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    // Kalkulasi Pendapatan per Divisi
    let fasTotal = 0, pelTotal = 0, prodTotal = 0, lainTotal = 0;

    filteredInvoices.forEach(inv => {
      // ACCRUAL = total tagihan (termasuk yang belum dibayar)
      // CASH = hanya yang sudah benar-benar dibayar
      const amount = reportType === 'ACCRUAL' ? inv.totalAmount : inv.paidAmount;
      
      const type = inv.items && inv.items.length > 0 ? inv.items[0].referenceType : 'CUSTOM';
      
      if (['BOOKING', 'TARIFF_DAY', 'TARIFF_MONTH'].includes(type)) fasTotal += amount;
      else if (type === 'TRAINING') pelTotal += amount;
      else if (type === 'CATALOG') prodTotal += amount;
      else lainTotal += amount;
    });

    const totalRevenue = fasTotal + pelTotal + prodTotal + lainTotal;

    // Kalkulasi Beban (Untuk saat ini global, bisa dikembangkan per divisi jika Expense memiliki field divisi)
    const totalExpense = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    
    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { fasTotal, pelTotal, prodTotal, lainTotal, totalRevenue, totalExpense, netProfit, profitMargin };
  }, [invoices, expenses, reportType, period]);

  return (
    <div className="flex flex-col w-full animate-in fade-in">
      
      {/* TOOLBAR KONTROL */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">Analisa Profit Center</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Laba/Rugi Per Divisi</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value as any)}
            className="bg-white text-xs font-bold text-slate-700 px-3 py-2 rounded-lg border border-slate-200 outline-none cursor-pointer shadow-sm"
          >
            <option value="ALL">Semua Waktu</option>
            <option value="THIS_YEAR">Tahun Ini</option>
            <option value="THIS_MONTH">Bulan Ini</option>
          </select>

          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          <button 
            onClick={() => setReportType('ACCRUAL')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${reportType === 'ACCRUAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Basis Akrual
          </button>
          <button 
            onClick={() => setReportType('CASH')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${reportType === 'CASH' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            Basis Kas
          </button>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50">
        
        {/* INFO BANNER */}
        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800 leading-relaxed shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-blue-600" />
          <p>
            Laporan ini menyajikan kinerja keuangan per pusat pendapatan (Profit Center). 
            <strong> {reportType === 'ACCRUAL' ? 'Basis Akrual' : 'Basis Kas'}</strong> mengkalkulasi pendapatan berdasarkan 
            {reportType === 'ACCRUAL' ? ' total nilai tagihan (invoice) yang diterbitkan, terlepas dari apakah sudah dibayar atau belum.' : ' nominal uang yang sudah benar-benar masuk/dibayar oleh pelanggan.'}
          </p>
        </div>

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-blue-500"/> Total Pendapatan</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">{formatRupiah(data.totalRevenue)}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-red-500"/> Total Pengeluaran</p>
            <p className="text-3xl font-black text-slate-800 relative z-10">{formatRupiah(data.totalExpense)}</p>
          </div>

          <div className={`${data.netProfit >= 0 ? 'bg-emerald-600 border-emerald-700' : 'bg-red-600 border-red-700'} p-5 rounded-2xl border shadow-lg relative overflow-hidden text-white`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -z-0"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2 flex items-center gap-1.5"><DollarSign className="w-4 h-4"/> Laba Bersih</p>
                <p className="text-3xl font-black">{formatRupiah(data.netProfit)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Margin</p>
                <p className="text-xl font-black bg-white/20 px-2 py-1 rounded-lg">{data.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* BREAKDOWN & REPORT TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* VISUAL BREAKDOWN (LEFT COLUMN) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart className="w-4 h-4"/> Kontribusi Pendapatan</h3>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2"><Building className="w-4 h-4 text-indigo-500"/><span className="text-sm font-bold text-slate-700">Sewa Fasilitas</span></div>
                  <span className="text-sm font-black text-slate-900">{data.totalRevenue > 0 ? ((data.fasTotal / data.totalRevenue) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${data.totalRevenue > 0 ? (data.fasTotal / data.totalRevenue) * 100 : 0}%` }}></div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{formatRupiah(data.fasTotal)}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500"/><span className="text-sm font-bold text-slate-700">Pelatihan</span></div>
                  <span className="text-sm font-black text-slate-900">{data.totalRevenue > 0 ? ((data.pelTotal / data.totalRevenue) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${data.totalRevenue > 0 ? (data.pelTotal / data.totalRevenue) * 100 : 0}%` }}></div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{formatRupiah(data.pelTotal)}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2"><Store className="w-4 h-4 text-orange-500"/><span className="text-sm font-bold text-slate-700">Produk Katalog</span></div>
                  <span className="text-sm font-black text-slate-900">{data.totalRevenue > 0 ? ((data.prodTotal / data.totalRevenue) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${data.totalRevenue > 0 ? (data.prodTotal / data.totalRevenue) * 100 : 0}%` }}></div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{formatRupiah(data.prodTotal)}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-slate-500"/><span className="text-sm font-bold text-slate-700">Layanan Lainnya</span></div>
                  <span className="text-sm font-black text-slate-900">{data.totalRevenue > 0 ? ((data.lainTotal / data.totalRevenue) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-slate-500 h-2.5 rounded-full" style={{ width: `${data.totalRevenue > 0 ? (data.lainTotal / data.totalRevenue) * 100 : 0}%` }}></div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-1.5">{formatRupiah(data.lainTotal)}</p>
              </div>

            </div>
          </div>

          {/* FORMAL P&L STATEMENT (RIGHT COLUMN) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Laporan Laba Rugi Komprehensif</h3>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {/* REVENUE SECTION */}
                  <tr className="bg-slate-50"><td colSpan={2} className="px-6 py-3 font-black text-indigo-900 text-xs uppercase tracking-wider border-b border-slate-200">PENDAPATAN OPERASIONAL</td></tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700 pl-10">Pendapatan Sewa Fasilitas & Ruang</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatRupiah(data.fasTotal)}</td>
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700 pl-10">Pendapatan Pelatihan & Edukasi</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatRupiah(data.pelTotal)}</td>
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700 pl-10">Pendapatan Penjualan Produk (Katalog)</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatRupiah(data.prodTotal)}</td>
                  </tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700 pl-10">Pendapatan Jasa Lainnya</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatRupiah(data.lainTotal)}</td>
                  </tr>
                  <tr className="bg-indigo-50/50">
                    <td className="px-6 py-4 font-black text-indigo-800 uppercase tracking-wider text-xs">TOTAL PENDAPATAN</td>
                    <td className="px-6 py-4 text-right font-black text-indigo-700 text-base">{formatRupiah(data.totalRevenue)}</td>
                  </tr>

                  {/* SPACING */}
                  <tr><td colSpan={2} className="h-4 bg-slate-50"></td></tr>

                  {/* EXPENSE SECTION */}
                  <tr className="bg-slate-50 border-t border-slate-200"><td colSpan={2} className="px-6 py-3 font-black text-red-900 text-xs uppercase tracking-wider border-b border-slate-200">BEBAN & PENGELUARAN</td></tr>
                  <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700 pl-10">Beban Operasional Global (Tercatat)</td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatRupiah(data.totalExpense)}</td>
                  </tr>
                  <tr className="bg-red-50/50">
                    <td className="px-6 py-4 font-black text-red-800 uppercase tracking-wider text-xs">TOTAL BEBAN</td>
                    <td className="px-6 py-4 text-right font-black text-red-700 text-base">({formatRupiah(data.totalExpense)})</td>
                  </tr>

                  {/* NET PROFIT */}
                  <tr className={`${data.netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    <td className="px-6 py-5 font-black uppercase tracking-widest text-sm">LABA BERSIH (NET PROFIT)</td>
                    <td className="px-6 py-5 text-right font-black text-xl">{formatRupiah(data.netProfit)}</td>
                  </tr>

                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}