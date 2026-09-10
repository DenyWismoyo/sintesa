// Lokasi file: src/app/billing/component/TabAgingPiutang.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Invoice } from '@/types';
import { 
  Clock, AlertTriangle, MessageCircle, ChevronDown, ChevronUp, 
  FileText, CheckCircle, Search, Filter, ShieldAlert, Phone
} from 'lucide-react';

interface Props {
  invoices: Invoice[];
  onViewDetail: (invoice: Invoice) => void;
}

type AgingBucket = 'NOT_DUE' | '1_30' | '31_60' | '61_90' | 'OVER_90';

interface CustomerAging {
  customerName: string;
  customerPhone: string;
  notDue: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  over90: number;
  total: number;
  invoices: Invoice[];
}

export default function TabAgingPiutang({ invoices, onViewDetail }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // 1. Logika Kalkulasi Umur Piutang
  const agingData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataMap = new Map<string, CustomerAging>();

    // Filter hanya invoice yang belum lunas dan tidak dibatalkan
    const activeInvoices = invoices.filter(inv => inv.remainingAmount > 0 && inv.status !== 'CANCELLED');

    activeInvoices.forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Hitung selisih hari
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let bucket: AgingBucket = 'NOT_DUE';
      if (diffDays > 0 && diffDays <= 30) bucket = '1_30';
      else if (diffDays > 30 && diffDays <= 60) bucket = '31_60';
      else if (diffDays > 60 && diffDays <= 90) bucket = '61_90';
      else if (diffDays > 90) bucket = 'OVER_90';

      const customerKey = inv.customerName;
      if (!dataMap.has(customerKey)) {
        dataMap.set(customerKey, {
          customerName: customerKey,
          customerPhone: inv.customerPhone || '',
          notDue: 0,
          days1_30: 0,
          days31_60: 0,
          days61_90: 0,
          over90: 0,
          total: 0,
          invoices: []
        });
      }

      const customerData = dataMap.get(customerKey)!;
      customerData.invoices.push(inv);
      customerData.total += inv.remainingAmount;

      if (bucket === 'NOT_DUE') customerData.notDue += inv.remainingAmount;
      else if (bucket === '1_30') customerData.days1_30 += inv.remainingAmount;
      else if (bucket === '31_60') customerData.days31_60 += inv.remainingAmount;
      else if (bucket === '61_90') customerData.days61_90 += inv.remainingAmount;
      else if (bucket === 'OVER_90') customerData.over90 += inv.remainingAmount;
    });

    return Array.from(dataMap.values()).sort((a, b) => b.total - a.total);
  }, [invoices]);

  // 2. Filter Pencarian
  const filteredData = useMemo(() => {
    if (!searchTerm) return agingData;
    const term = searchTerm.toLowerCase();
    return agingData.filter(d => d.customerName.toLowerCase().includes(term));
  }, [agingData, searchTerm]);

  // 3. Kalkulasi Summary / Total Keseluruhan
  const summary = useMemo(() => {
    return agingData.reduce((acc, curr) => ({
      notDue: acc.notDue + curr.notDue,
      days1_30: acc.days1_30 + curr.days1_30,
      days31_60: acc.days31_60 + curr.days31_60,
      days61_90: acc.days61_90 + curr.days61_90,
      over90: acc.over90 + curr.over90,
      total: acc.total + curr.total
    }), { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0 });
  }, [agingData]);

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const toggleExpand = (customerName: string) => {
    if (expandedCustomer === customerName) setExpandedCustomer(null);
    else setExpandedCustomer(customerName);
  };

  const handleSendReminder = (customer: CustomerAging) => {
    if (!customer.customerPhone) {
      alert("Nomor telepon pelanggan tidak tersedia.");
      return;
    }
    
    // Format nomor HP (ganti 0 dengan 62)
    let phone = customer.customerPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const totalOverdue = customer.days1_30 + customer.days31_60 + customer.days61_90 + customer.over90;
    
    const message = `Halo Bapak/Ibu dari *${customer.customerName}*,\n\nKami dari Solo Technopark ingin menginformasikan bahwa terdapat tagihan yang belum terselesaikan senilai *${formatRupiah(customer.total)}*.\n\nDari jumlah tersebut, senilai *${formatRupiah(totalOverdue)}* telah melewati masa jatuh tempo.\n\nMohon bantuannya untuk segera melakukan pelunasan. Abaikan pesan ini jika Anda sudah melakukan pembayaran.\n\nTerima kasih.`;
    
    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in">
      
      {/* HEADER SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Total Piutang Aktif</p>
          <p className="text-2xl font-black text-slate-800">{formatRupiah(summary.total)}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5"/> Belum Jatuh Tempo</p>
          <p className="text-2xl font-black text-emerald-700">{formatRupiah(summary.notDue)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Total Menunggak</p>
          <p className="text-2xl font-black text-amber-700">{formatRupiah(summary.total - summary.notDue)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-center">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Menunggak &gt; 90 Hari</p>
          <p className="text-2xl font-black text-red-700">{formatRupiah(summary.over90)}</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border-b border-slate-100">
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari nama pelanggan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
           <Filter className="w-3.5 h-3.5"/> <span>Diurutkan berdasarkan saldo terbesar</span>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="overflow-x-auto w-full min-h-[400px]">
        <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
          <thead className="text-[10px] text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4 w-10"></th>
              <th className="px-6 py-4">Pelanggan</th>
              <th className="px-4 py-4 text-right bg-emerald-50/50">Belum Jatuh Tempo</th>
              <th className="px-4 py-4 text-right">1 - 30 Hari</th>
              <th className="px-4 py-4 text-right">31 - 60 Hari</th>
              <th className="px-4 py-4 text-right">61 - 90 Hari</th>
              <th className="px-4 py-4 text-right bg-red-50/50">&gt; 90 Hari</th>
              <th className="px-6 py-4 text-right font-black text-slate-800">Total Piutang</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            
            {/* BARIS TOTAL KESELURUHAN */}
            <tr className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
              <td colSpan={2} className="px-6 py-3 text-right">TOTAL KESELURUHAN</td>
              <td className="px-4 py-3 text-right text-emerald-400">{formatRupiah(summary.notDue)}</td>
              <td className="px-4 py-3 text-right">{formatRupiah(summary.days1_30)}</td>
              <td className="px-4 py-3 text-right">{formatRupiah(summary.days31_60)}</td>
              <td className="px-4 py-3 text-right">{formatRupiah(summary.days61_90)}</td>
              <td className="px-4 py-3 text-right text-red-400">{formatRupiah(summary.over90)}</td>
              <td className="px-6 py-3 text-right text-base font-black text-amber-300">{formatRupiah(summary.total)}</td>
              <td></td>
            </tr>

            {filteredData.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-16 text-center text-slate-500 font-bold">Tidak ada data piutang ditemukan.</td></tr>
            ) : (
              filteredData.map((customer, idx) => {
                const isExpanded = expandedCustomer === customer.customerName;
                const hasOverdue = customer.total - customer.notDue > 0;

                return (
                  <React.Fragment key={idx}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleExpand(customer.customerName)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{customer.customerName}</p>
                        {customer.customerPhone && <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.customerPhone}</p>}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-600 bg-emerald-50/20">{customer.notDue > 0 ? formatRupiah(customer.notDue) : '-'}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-600">{customer.days1_30 > 0 ? formatRupiah(customer.days1_30) : '-'}</td>
                      <td className="px-4 py-4 text-right font-semibold text-amber-600">{customer.days31_60 > 0 ? formatRupiah(customer.days31_60) : '-'}</td>
                      <td className="px-4 py-4 text-right font-semibold text-orange-600">{customer.days61_90 > 0 ? formatRupiah(customer.days61_90) : '-'}</td>
                      <td className="px-4 py-4 text-right font-bold text-red-600 bg-red-50/20">{customer.over90 > 0 ? formatRupiah(customer.over90) : '-'}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatRupiah(customer.total)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleSendReminder(customer)}
                          disabled={!hasOverdue || !customer.customerPhone}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm ${
                            hasOverdue && customer.customerPhone 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                          title={!customer.customerPhone ? 'Nomor HP tidak ada' : 'Kirim Reminder WA'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Reminder
                        </button>
                      </td>
                    </tr>

                    {/* SUB-TABLE: RINCIAN INVOICE PELANGGAN (EXPANDED) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200 shadow-inner">
                        <td colSpan={9} className="px-14 py-4">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Rincian Tagihan: {customer.customerName}</h4>
                            <table className="w-full text-xs text-left">
                              <thead className="text-slate-400 border-b border-slate-100">
                                <tr>
                                  <th className="py-2">No. Invoice</th>
                                  <th className="py-2">Tanggal Terbit</th>
                                  <th className="py-2">Jatuh Tempo</th>
                                  <th className="py-2 text-right">Total Tagihan</th>
                                  <th className="py-2 text-right">Sisa (Piutang)</th>
                                  <th className="py-2 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {customer.invoices.map(inv => {
                                  const invDate = new Date(inv.dueDate);
                                  invDate.setHours(0,0,0,0);
                                  const tdy = new Date();
                                  tdy.setHours(0,0,0,0);
                                  const isOverdue = tdy.getTime() > invDate.getTime();

                                  return (
                                    <tr key={inv.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => onViewDetail(inv)}>
                                      <td className="py-2.5 font-bold text-blue-600 hover:underline">{inv.invoiceNumber}</td>
                                      <td className="py-2.5 text-slate-600">{inv.date}</td>
                                      <td className="py-2.5 text-slate-600 flex items-center gap-1.5">
                                        {inv.dueDate} {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                      </td>
                                      <td className="py-2.5 text-right font-semibold text-slate-700">{formatRupiah(inv.totalAmount)}</td>
                                      <td className="py-2.5 text-right font-black text-slate-900">{formatRupiah(inv.remainingAmount)}</td>
                                      <td className="py-2.5 text-center">
                                        {isOverdue 
                                          ? <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] rounded font-bold uppercase">Jatuh Tempo</span>
                                          : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] rounded font-bold uppercase">Aman</span>
                                        }
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}