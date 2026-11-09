'use client';

import React, { useState } from 'react';
import { Clock, AlertCircle, FileText, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Invoice } from '@/types';
import ModalInvoiceDetail from './ModalInvoiceDetail';
import { AdminFilterBar, AdminResponsiveView, AdminMobileCard } from '@/components/admin';

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
    <div className="space-y-4 animate-in fade-in">
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nomor tagihan atau nama pelanggan..."
        totalHits={filteredInvoices.length}
        totalLabel="antrean verifikasi"
        hasActiveFilters={Boolean(searchQuery)}
        onReset={() => setSearchQuery('')}
      />

      <AdminResponsiveView
        items={filteredInvoices}
        emptyIcon={<Check className="w-8 h-8 text-slate-300" />}
        emptyTitle="Tidak ada antrean verifikasi."
        emptySubtitle="Semua bukti transfer pelanggan sudah diproses atau belum ada yang masuk."
        renderDesktopTable={() => (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Nomor Invoice & Klien</th>
                <th className="px-6 py-4 text-center">Tgl Konfirmasi</th>
                <th className="px-6 py-4 text-right">Nominal Transfer</th>
                <th className="px-6 py-4 text-center">Validasi AI & Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => {
                const pendingItem = inv.history?.find((h: any) => h.status === 'PENDING');
                const proofMeta = (inv as any).paymentProofMeta;
                
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
                      <div className="flex flex-col items-center gap-1">
                        {proofMeta ? (
                          proofMeta.isMatched ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              AI Cocok ({formatRupiah(proofMeta.ocrAmount)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                              AI: {formatRupiah(proofMeta.ocrAmount)}
                            </span>
                          )
                        ) : null}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          Menunggu Cek
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Tinjau Bukti <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        renderMobileCard={(inv) => {
          const pendingItem = inv.history?.find((h: any) => h.status === 'PENDING');
          const proofMeta = (inv as any).paymentProofMeta;
          return (
            <AdminMobileCard
              key={inv.id}
              code={inv.invoiceNumber}
              title={inv.customerName}
              subtitle={`Dikonfirmasi: ${pendingItem?.date || '-'}`}
              badge={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  Menunggu Cek
                </span>
              }
              fields={
                proofMeta
                  ? [
                      {
                        label: 'Validasi AI OCR',
                        value: proofMeta.isMatched
                          ? `Cocok (${formatRupiah(proofMeta.ocrAmount)})`
                          : `Selisih (${formatRupiah(proofMeta.ocrAmount)})`,
                        fullWidth: true,
                      },
                    ]
                  : []
              }
              footerLeft={
                <span className="text-sm font-black text-slate-900">
                  {formatRupiah(pendingItem?.amount || 0)}
                </span>
              }
              actions={
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Tinjau Bukti <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }
            />
          );
        }}
      />

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
