'use client';

import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, Check } from 'lucide-react';
import { Invoice } from '@/types';
import ModalInvoiceDetail from './ModalInvoiceDetail';

interface Props {
  invoices: Invoice[];
  accounts: any[];
  onVerifyPending: (invoice: Invoice, historyItem: any) => void;
  onRejectPending: (invoice: Invoice, historyId: string) => void;
}

export default function TabKonfirmasi({ invoices, accounts, onVerifyPending, onRejectPending }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Ambil hanya invoice yang punya riwayat PENDING (belum diverifikasi)
  const pendingInvoices = invoices.filter(inv => 
    inv.status !== 'PAID' && 
    inv.status !== 'CANCELLED' && 
    inv.history && 
    inv.history.some((h: any) => h.status === 'PENDING')
  );

  // Filter tambahan berdasarkan pencarian
  const filteredInvoices = pendingInvoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            Antrean Verifikasi Pembayaran Publik
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Daftar bukti transfer yang dikirim oleh pelanggan dan menunggu persetujuan Anda.</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nomor tagihan/pelanggan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Nomor Invoice & Klien</th>
                <th className="px-6 py-4 text-center">Tgl Konfirmasi</th>
                <th className="px-6 py-4 text-right">Nominal Transfer</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => {
                // Temukan item history yang berstatus PENDING untuk ditampilkan datanya
                const pendingItem = inv.history?.find((h: any) => h.status === 'PENDING');
                
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><FileText className="w-4 h-4" /></div>
                        <div>
                          <p className="font-mono font-black text-slate-800 text-sm tracking-wide">{inv.invoiceNumber}</p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">{inv.customerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Clock className="w-3.5 h-3.5"/> {pendingItem?.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-slate-900">{formatRupiah(pendingItem?.amount || 0)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Menunggu Cek
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        Tinjau Bukti <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-800">Tidak ada antrean verifikasi.</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Semua bukti transfer pelanggan sudah diproses atau belum ada yang masuk.</p>
          </div>
        )}
      </div>

      {/* Gunakan ulang Modal Detail untuk meninjau */}
      <ModalInvoiceDetail 
        invoice={selectedInvoice}
        accounts={accounts}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onVerifyPending={onVerifyPending}
        onRejectPending={onRejectPending}
      />

    </div>
  );
}