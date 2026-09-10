// Lokasi file: src/app/billing/component/ModalPreviewKwitansi.tsx
import React, { useState } from 'react';
import { X, CheckCircle, Download, Receipt, User } from 'lucide-react';
import { Invoice } from '@/types';

interface Props {
  invoice: Invoice;
  onClose: () => void;
  // Menambahkan parameter penyetor dan penerima
  onPrint: (invoice: Invoice, selectedPayment: any, penyetorName: string, penerimaName: string) => void;
}

export default function ModalPreviewKwitansi({ invoice, onClose, onPrint }: Props) {
  const successfulPayments = invoice.history?.filter((h: any) => h.status === 'SUCCESS') || [];
  
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    successfulPayments.length > 0 ? successfulPayments[successfulPayments.length - 1].id : ''
  );

  // STATE BARU: Untuk Tanda Tangan
  const [penyetorName, setPenyetorName] = useState(invoice.customerName || '');
  const [penerimaName, setPenerimaName] = useState('');

  const handlePrint = () => {
    const selected = successfulPayments.find((p: any) => p.id === selectedPaymentId);
    if (selected) {
      onPrint(invoice, selected, penyetorName, penerimaName);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100">
        
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Cetak Kwitansi (Tanda Terima)</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2 border border-slate-200 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">1. Pilih Riwayat Transaksi Lunas:</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar mb-6">
            {successfulPayments.length > 0 ? (
              successfulPayments.map((payment: any, index: number) => (
                <label 
                  key={payment.id} 
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPaymentId === payment.id ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="mt-0.5">
                    <input 
                      type="radio" 
                      name="payment_selection" 
                      value={payment.id}
                      checked={selectedPaymentId === payment.id}
                      onChange={() => setSelectedPaymentId(payment.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-800 text-sm">Pembayaran ke-{index + 1}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded uppercase">{payment.method}</span>
                    </div>
                    <p className="text-lg font-black text-emerald-600 mb-1">{formatRupiah(payment.amount)}</p>
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-500" /> Diterima: {payment.date}
                    </p>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-sm font-bold text-slate-500">Belum ada pembayaran sukses.</p>
              </div>
            )}
          </div>

          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block border-t border-slate-100 pt-4">2. Kolom Tanda Tangan:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1"><User className="w-3 h-3"/> Yang Menyerahkan</label>
              <input 
                type="text" 
                value={penyetorName} 
                onChange={e => setPenyetorName(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1"><User className="w-3 h-3"/> Penerima / Kasir</label>
              <input 
                type="text" 
                value={penerimaName} 
                onChange={e => setPenerimaName(e.target.value)} 
                placeholder="Kosongi untuk Default" 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            onClick={handlePrint}
            disabled={!selectedPaymentId} 
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> Unduh Kwitansi PDF
          </button>
        </div>

      </div>
    </div>
  );
}