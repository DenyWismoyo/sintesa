// Lokasi Directory: src/app/billing/component/TabExpenses.tsx
import React, { useState } from 'react';
import { Search, Filter, Receipt, FileText, CheckCircle2, Clock, XCircle, Plus, ShieldAlert } from 'lucide-react';
import { Expense } from '@/types';

interface Props {
  expenses: Expense[];
  activeTab: string;
  onUpdateStatus: (expense: Expense, status: Expense['status']) => void;
  onOpenAdd?: () => void; 
  canApprove?: boolean; // BARU: Kontrol keamanan dari parent
}

export default function TabExpenses({ expenses, activeTab, onUpdateStatus, onOpenAdd, canApprove = true }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredExpenses = expenses.filter(exp => {
    const matchStatus = filterStatus === 'ALL' || exp.status === filterStatus;
    const matchSearch = exp.payeeName.toLowerCase().includes(search.toLowerCase()) || 
                        exp.description.toLowerCase().includes(search.toLowerCase()) ||
                        exp.expenseNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const renderStatus = (status: string) => {
    switch(status) {
      case 'PENDING_APPROVAL': return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5"/> Menunggu Persetujuan</span>;
      case 'APPROVED': return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5"/> Disetujui (Belum Cair)</span>;
      case 'PAID': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 w-fit"><Receipt className="w-3.5 h-3.5"/> Lunas / Telah Cair</span>;
      case 'CANCELLED': return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 w-fit"><XCircle className="w-3.5 h-3.5"/> Dibatalkan</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in p-6 bg-slate-50/50">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Pengeluaran</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar beban operasional, tagihan vendor, dan belanja barang.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari vendor, deskripsi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm outline-none cursor-pointer">
            <option value="ALL">Semua Status</option>
            <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui (Siap Cair)</option>
            <option value="PAID">Lunas / Cair</option>
          </select>
          {onOpenAdd && (
            <button onClick={onOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Ajukan Pengeluaran
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">Informasi Pengeluaran</th>
              <th className="px-6 py-4">Kategori Beban (BAS)</th>
              <th className="px-6 py-4">Nominal</th>
              <th className="px-6 py-4">Status Pencairan</th>
              <th className="px-6 py-4 text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 align-top">
                  <div className="font-bold text-slate-800 mb-1">{exp.expenseNumber}</div>
                  <div className="text-sm text-slate-600 font-medium mb-1 truncate max-w-[250px]">{exp.description}</div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5"><Clock className="w-3 h-3"/> {exp.date} &bull; {exp.payeeName}</div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-red-700 bg-red-50 border border-red-100">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]" title={exp.categoryName}>{exp.categoryName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 align-top font-black text-slate-800 text-base">
                  {formatRupiah(exp.amount)}
                </td>
                <td className="px-6 py-4 align-top">
                  {renderStatus(exp.status)}
                </td>
                <td className="px-6 py-4 align-top text-center">
                  
                  {exp.status === 'PENDING_APPROVAL' && (
                    <div className="flex items-center justify-center gap-2">
                      {canApprove ? (
                        <>
                          <button onClick={() => onUpdateStatus(exp, 'APPROVED')} className="px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all shadow-sm">Setujui</button>
                          <button onClick={() => onUpdateStatus(exp, 'CANCELLED')} className="px-3 py-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-all shadow-sm">Tolak</button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                          <ShieldAlert className="w-3 h-3"/> Menunggu Atasan
                        </span>
                      )}
                    </div>
                  )}

                  {exp.status === 'APPROVED' && (
                    <button onClick={() => onUpdateStatus(exp, 'PAID')} className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-all shadow-sm">
                      Catat Pencairan
                    </button>
                  )}
                  
                  {exp.status === 'PAID' && (
                    <span className="text-[11px] font-bold text-slate-400">Selesai</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Tidak ada data pengeluaran ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}