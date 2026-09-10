// Lokasi file: src/app/billing/component/ModalAllocateInvoice.tsx
import React, { useState, useEffect } from 'react';
import { X, Network, CheckCircle, Loader2, Landmark, Sparkles, ArrowRight } from 'lucide-react';
import { Invoice, Account } from '@/types';

interface Props {
  invoice: Invoice;
  accounts: Account[];
  onClose: () => void;
  onAllocate: (invoiceId: string, invoiceNumber: string, amount: number, coaId: string, coaName: string) => Promise<void>;
}

export default function ModalAllocateInvoice({ invoice, accounts, onClose, onAllocate }: Props) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    suggestedCoaId: string;
    confidence: number;
    reasoning: string;
    alternativeCoaId?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Hanya ambil akun PENDAPATAN yang sifatnya DETAIL (Rincian) atau TRANSACTION
  const validAccounts = accounts.filter(a => a.type === 'PENDAPATAN' && (a.accountBehavior === 'DETAIL' || a.accountBehavior === 'TRANSACTION'));
  
  // STATE: Otomatis pilih suggestion dari sistem jika ada, jika tidak kosong
  const [selectedCoaId, setSelectedCoaId] = useState(invoice.allocatedCoaId || invoice.suggestedCoaId || '');

  // Cari detail akun yang disarankan oleh sistem (untuk keperluan UI)
  const suggestedAccount = accounts.find(a => a.id === invoice.suggestedCoaId);
  const aiSuggestedAccount = aiResult ? accounts.find(a => a.id === aiResult.suggestedCoaId) : null;

  const handleAskAi = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const payload = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        description: [
          invoice.notes,
          invoice.customerName ? `Pelanggan: ${invoice.customerName}` : '',
        ].filter(Boolean).join('. '),
        items: (invoice.items && invoice.items.length > 0)
          ? invoice.items.map(i => ({ name: i.description, description: i.description, amount: i.total }))
          : [{ name: invoice.notes || 'Layanan Teknopark', description: invoice.notes || '', amount: invoice.paidAmount || invoice.totalAmount }],
        paidAmount: invoice.paidAmount || invoice.totalAmount,
        availableAccounts: validAccounts.map(a => ({
          id: a.id || '',
          code: a.code || '',
          name: a.name || '',
          type: a.type || 'PENDAPATAN',
          accountBehavior: a.accountBehavior || 'DETAIL'
        }))
      };

      const res = await fetch('/api/ai/suggest-coa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mendapatkan rekomendasi AI');
      }

      setAiResult(data.data);
      if (data.data.suggestedCoaId) {
        setSelectedCoaId(data.data.suggestedCoaId);
      }
    } catch (err: any) {
      console.error('AI COA error:', err);
      setAiError(err.message || 'Terjadi kesalahan saat memanggil AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoaId) { alert("Harap pilih kode rekening rincian kegiatan."); return; }
    
    setLoading(true);
    const selectedAccount = accounts.find(a => a.id === selectedCoaId);
    if (selectedAccount && invoice.id) {
      const coaName = selectedAccount.accountBehavior === 'DETAIL' 
          ? `${selectedAccount.code === '-' ? '' : selectedAccount.code} Rincian: ${selectedAccount.name}`
          : `${selectedAccount.code} - ${selectedAccount.name}`;
          
      // Panggil dengan data lengkap untuk jurnal
      await onAllocate(invoice.id, invoice.invoiceNumber, invoice.paidAmount, selectedAccount.id!, coaName);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Network className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-black">Alokasi Rincian BAS</h2>
              <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest mt-0.5">Validasi Back-Office</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Referensi Tagihan</p>
              <p className="font-black text-slate-800">{invoice.invoiceNumber}</p>
              {invoice.customerName && (
                <p className="text-xs text-slate-600 mt-0.5">{invoice.customerName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Nilai Jurnal Pendapatan</p>
              <p className="font-black text-blue-700">Rp {invoice.paidAmount.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Action: Minta Rekomendasi AI */}
          <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Smart COA Recommender</p>
                <p className="text-[10px] text-slate-500">Clario DeepSeek Financial Pro</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAskAi}
              disabled={aiLoading || validAccounts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiResult ? 'Analisis Ulang' : 'Minta Saran AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* UI: REKOMENDASI AI RESULT */}
          {aiResult && aiSuggestedAccount && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-200 p-4 rounded-2xl shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Rekomendasi Akun AI</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Keyakinan {Math.round(aiResult.confidence * 100)}%
                </span>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-xs mb-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400">Akun BAS yang disarankan:</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs">{aiSuggestedAccount.code}</span>
                    <span>{aiSuggestedAccount.name}</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                "{aiResult.reasoning}"
              </p>
            </div>
          )}

          {aiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {aiError}
            </div>
          )}

          {/* UI KHUSUS: SMART SUGGESTION (ORIGIN MODULE) */}
          {invoice.suggestedCoaId && suggestedAccount && !aiResult && (
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-100 rounded-full blur-xl opacity-50"></div>
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-indigo-600" />
                 <p className="text-xs font-black text-indigo-800 uppercase tracking-wider">Pemetaan Otomatis (Smart Link)</p>
               </div>
               <p className="text-[11px] text-indigo-700 font-medium mb-3">
                 Sistem mendeteksi tagihan ini berasal dari modul Aset/Layanan terdaftar. Kami telah memilihkan kode BAS yang paling tepat untuk Anda.
               </p>
               <div className="bg-white rounded-xl p-3 border border-indigo-100 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">Direkomendasikan ke:</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{suggestedAccount.code}</span> 
                      {suggestedAccount.name}
                    </span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
               </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 mb-2 block flex items-center justify-between">
              <span>{invoice.suggestedCoaId || aiResult ? 'Pilihan Kode BAS Pendapatan' : 'Petakan ke Rincian Kegiatan (Pendapatan)'}</span>
            </label>
            <div className="relative">
              <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select 
                required 
                value={selectedCoaId} 
                onChange={(e) => setSelectedCoaId(e.target.value)} 
                className={`w-full pl-10 pr-4 py-3 bg-white border-2 rounded-xl text-sm font-semibold focus:outline-none transition-colors appearance-none cursor-pointer ${
                  (invoice.suggestedCoaId && selectedCoaId === invoice.suggestedCoaId) || (aiResult && selectedCoaId === aiResult.suggestedCoaId)
                    ? 'border-indigo-400 text-indigo-800 bg-indigo-50/30' 
                    : 'border-slate-200 text-slate-700 focus:border-blue-500'
                }`}
              >
                <option value="" disabled>-- Pilih Rincian Sub-Kegiatan --</option>
                {validAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountBehavior === 'DETAIL' ? `  ↳ (Rincian) ${acc.name}` : `${acc.code} - ${acc.name}`}
                  </option>
                ))}
              </select>
            </div>
            {!invoice.suggestedCoaId && !aiResult && (
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                * Daftar di atas mengambil data dari menu Pengaturan &gt; Bagan Akun Standar yang bersifat <strong>Sub Kegiatan / Rincian</strong>.
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-70 group">
            {loading ? <Loader2 className="animate-spin w-4 h-4"/> : (
              <>
                <CheckCircle className="w-4 h-4"/> 
                {(invoice.suggestedCoaId && selectedCoaId === invoice.suggestedCoaId) || (aiResult && selectedCoaId === aiResult.suggestedCoaId)
                  ? 'Konfirmasi Pemetaan Otomatis' 
                  : 'Konfirmasi Alokasi Pendapatan'}
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}