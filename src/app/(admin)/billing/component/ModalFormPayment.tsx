import React, { useState, useEffect, useRef } from 'react';
import { X, WalletCards, Loader2, Upload, CheckCircle, Trash2, FileText } from 'lucide-react';
import { Invoice, Account } from '@/types';

interface Props {
  invoice: Invoice;
  accounts: Account[];
  onClose: () => void;
  // Menerima data history yang PENDING (jika mode verifikasi)
  pendingHistoryItem?: any; 
  onSave: (invoiceId: string, amount: number, accountId: string, accountName: string, file: File | null, pendingHistoryId?: string) => Promise<void>;
}

export default function ModalFormPayment({ invoice, accounts, onClose, onSave, pendingHistoryItem }: Props) {
  const remaining = invoice.totalAmount - invoice.paidAmount;
  
  // Jika sedang memvalidasi bukti, nominal otomatis dikunci ke nilai yang dikirim user
  const [amount, setAmount] = useState(pendingHistoryItem ? pendingHistoryItem.amount.toString() : remaining.toString());
  
  const cashAccounts = accounts.filter(a => a.type === 'KAS_BANK' && a.accountBehavior !== 'HEADER');
  const [selectedBankId, setSelectedBankId] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const isVerifying = !!pendingHistoryItem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.id || !selectedBankId) { alert("Harap pilih Kas/Bank penerima dana."); return; }
    
    const selectedBank = accounts.find(a => a.id === selectedBankId);
    if (!selectedBank) return;

    setLoading(true);
    await onSave(invoice.id, Number(amount), selectedBank.id!, selectedBank.name, file, pendingHistoryItem?.id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
        
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVerifying ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isVerifying ? <CheckCircle className="w-5 h-5"/> : <WalletCards className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">{isVerifying ? 'Validasi Bukti Publik' : 'Catat Penerimaan Manual'}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {isVerifying && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-2">
              <p className="text-xs font-bold text-amber-800 mb-1">Pilih Rekening Tujuan (Jurnal)</p>
              <p className="text-[11px] text-amber-700">Publik telah mengunggah bukti senilai Rp {Number(amount).toLocaleString('id-ID')}. Anda hanya perlu mengarahkan dana ini masuk ke akun kas/bank yang mana.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Nominal Uang Masuk</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
              <input 
                type="number" required max={remaining} value={amount} 
                onChange={e => setAmount(e.target.value)} 
                disabled={isVerifying} // Dikunci jika ini verifikasi
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 disabled:opacity-70 disabled:cursor-not-allowed" 
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Pilih Rekening Penerima (Kas/Bank)</label>
            <select required value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer">
              <option value="">-- Pilih Rekening Masuk --</option>
              {cashAccounts.map(acc => (
                 <option key={acc.id} value={acc.id}>
                   {acc.accountBehavior === 'DETAIL' ? `  ↳ (Rincian) ${acc.name}` : `${acc.code} - ${acc.name}`}
                 </option>
              ))}
            </select>
          </div>

          {!isVerifying && (
            <div className="space-y-1.5 mt-2">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Siap diunggah</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0 ml-2"
                    title="Hapus file ini"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer group shadow-2xs"
                >
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform border border-slate-100">
                    <Upload className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Upload Bukti Transfer Manual (Opsional)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau PDF</p>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 mt-2">
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Konfirmasi & Jurnal Saldo Kas'}
          </button>
        </form>

      </div>
    </div>
  );
}