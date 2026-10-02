// Lokasi Directory: src/app/billing/component/ModalFormExpense.tsx
import React, { useState, useRef } from 'react';
import { X, Upload, Receipt, Loader2, AlertCircle, WalletCards, FileText, Trash2 } from 'lucide-react';
import { Expense, Account } from '@/types';

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Expense, 'id'>, file: File | null) => Promise<void>;
  accounts: Account[];
}

export default function ModalFormExpense({ onClose, onSubmit, accounts }: Props) {
  const [loading, setLoading] = useState(false);
  
  // FILTER AKUN: Beban untuk Kategori, Kas/Bank untuk Sumber Dana (Abaikan Header)
  const expenseAccounts = accounts.filter(a => a.type === 'BEBAN' && a.accountBehavior !== 'HEADER');
  const cashAccounts = accounts.filter(a => a.type === 'KAS_BANK' && a.accountBehavior !== 'HEADER');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    categoryName: '',
    payeeName: '',
    description: '',
    amount: '',
    sourceAccountId: '',
    expenseNumber: `EXP-${Date.now()}`
  });
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.sourceAccountId) {
      alert("Kategori Beban dan Sumber Dana Kas/Bank wajib dipilih.");
      return;
    }

    setLoading(true);
    await onSubmit({
      ...formData,
      amount: Number(formData.amount),
      status: 'PENDING_APPROVAL'
    }, file);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[95vh]">
        
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Receipt className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-black text-slate-800">Catat Pengeluaran</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Integrasi BAS Beban</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-6">
          <form id="expenseForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                   <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Sumber Dana (Kas/Bank)</label>
                   <div className="relative">
                     <WalletCards className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                     <select 
                       required 
                       value={formData.sourceAccountId} 
                       onChange={e => setFormData({...formData, sourceAccountId: e.target.value})} 
                       className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                     >
                       <option value="">-- Pilih Rekening Asal --</option>
                       {cashAccounts.map(acc => (
                         <option key={acc.id} value={acc.id}>
                           {acc.accountBehavior === 'DETAIL' ? `  ↳ (Rincian) ${acc.name}` : `${acc.code} - ${acc.name}`}
                         </option>
                       ))}
                     </select>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Kategori Beban (BAS)</label>
                   <select 
                     required 
                     value={formData.categoryId} 
                     onChange={e => {
                       const selected = expenseAccounts.find(a => a.id === e.target.value);
                       setFormData({...formData, categoryId: e.target.value, categoryName: selected?.name || ''});
                     }} 
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                   >
                     <option value="">-- Pilih Kategori Pengeluaran --</option>
                     {expenseAccounts.map(acc => (
                       <option key={acc.id} value={acc.id}>
                         {acc.accountBehavior === 'DETAIL' ? `  ↳ (Rincian) ${acc.name}` : `${acc.code} - ${acc.name}`}
                       </option>
                     ))}
                   </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Penerima Dana (Vendor/Pegawai)</label>
                  <input type="text" required placeholder="Cth: PLN / Toko ABC" value={formData.payeeName} onChange={e => setFormData({...formData, payeeName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Nominal Pengeluaran</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                    <input type="number" required placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Tanggal & Deskripsi</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-3" />
                  <textarea required placeholder="Rincian / Keterangan Pembelian..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none"></textarea>
                </div>
              </div>
            </div>

            {/* UPLOAD BUKTI NOTA */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">
                Bukti Nota / Kwitansi <span className="text-slate-400 font-normal normal-case">(Opsional, JPG/PNG/PDF, maks 2MB)</span>
              </label>
              {/* Hidden input file dengan ref */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {file ? (
                /* === CARD PREVIEW FILE — terlihat jelas di mobile & desktop === */
                <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
                  {/* Ikon tipe file */}
                  <div className="w-11 h-11 bg-white border border-green-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {/* Info file */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB
                      {file.type.startsWith('image/') ? ' · Gambar' : ' · PDF'}
                    </p>
                  </div>
                  {/* Tombol aksi — selalu terlihat, mudah di-tap mobile */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              ) : (
                /* === ZONA UPLOAD — klik tombol, bukan overlay transparan === */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 active:scale-[0.99] transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Upload className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Upload Bukti Nota / Kwitansi</p>
                  <p className="text-xs text-slate-400">Ketuk / klik untuk memilih file</p>
                </button>
              )}
            </div>

          </form>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <button type="submit" form="expenseForm" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Ajukan Pengeluaran'}
          </button>
        </div>

      </div>
    </div>
  );
}