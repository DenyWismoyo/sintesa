// Lokasi Directory: src/app/billing/component/TabExpenses.tsx
import React, { useState } from 'react';
import { Receipt, FileText, CheckCircle2, Clock, XCircle, Plus, ShieldAlert } from 'lucide-react';
import { Expense } from '@/types';
import { AdminFilterBar, AdminResponsiveView, AdminMobileCard } from '@/components/admin';

interface Props {
  expenses: Expense[];
  activeTab: string;
  onUpdateStatus: (expense: Expense, status: Expense['status']) => void;
  onOpenAdd?: () => void; 
  canApprove?: boolean;
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

  const renderActionButtons = (exp: Expense) => {
    if (exp.status === 'PENDING_APPROVAL') {
      return canApprove ? (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => onUpdateStatus(exp, 'APPROVED')} className="px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all shadow-sm">Setujui</button>
          <button onClick={() => onUpdateStatus(exp, 'CANCELLED')} className="px-3 py-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-all shadow-sm">Tolak</button>
        </div>
      ) : (
        <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3"/> Menunggu Atasan
        </span>
      );
    }
    if (exp.status === 'APPROVED') {
      return (
        <button onClick={() => onUpdateStatus(exp, 'PAID')} className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-all shadow-sm">
          Catat Pencairan
        </button>
      );
    }
    if (exp.status === 'PAID') {
      return <span className="text-[11px] font-bold text-slate-400">Selesai</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in space-y-4">
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nomor, vendor, atau deskripsi pengeluaran..."
        filters={[
          {
            id: 'status',
            label: 'Status Pencairan',
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: 'Semua Status', value: 'ALL' },
              { label: 'Menunggu Persetujuan', value: 'PENDING_APPROVAL' },
              { label: 'Disetujui (Siap Cair)', value: 'APPROVED' },
              { label: 'Lunas / Cair', value: 'PAID' },
            ],
          },
        ]}
        hasActiveFilters={Boolean(search || filterStatus !== 'ALL')}
        onReset={() => {
          setSearch('');
          setFilterStatus('ALL');
        }}
        extraActions={
          onOpenAdd ? (
            <button onClick={onOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Ajukan Pengeluaran
            </button>
          ) : undefined
        }
      />

      <AdminResponsiveView
        items={filteredExpenses}
        emptyTitle="Tidak ada data pengeluaran ditemukan"
        emptySubtitle="Belum ada pengajuan pengeluaran atau tidak ada yang cocok dengan filter."
        renderDesktopTable={() => (
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
                    {renderActionButtons(exp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        renderMobileCard={(exp) => (
          <AdminMobileCard
            key={exp.id}
            code={exp.expenseNumber}
            title={exp.description}
            subtitle={`${exp.payeeName} • ${exp.date}`}
            badge={renderStatus(exp.status)}
            fields={[
              {
                label: 'Kategori Beban (BAS)',
                value: exp.categoryName,
                fullWidth: true,
              },
            ]}
            footerLeft={
              <span className="text-sm font-black text-slate-900">
                {formatRupiah(exp.amount)}
              </span>
            }
            actions={renderActionButtons(exp)}
          />
        )}
      />
    </div>
  );
}