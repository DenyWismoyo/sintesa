// Lokasi file: src/app/admin/tenant/components/TabTagihanTenant.tsx
import React, { useState } from 'react';
import { Search, Receipt, Building, Mail, Phone, ArrowRight, History, Eye, CheckCircle, Clock, AlertCircle, PieChart, XCircle, FileText } from 'lucide-react';
import { Tenant, Invoice } from '@/types';

interface Props {
  tenants: Tenant[];
  invoices: Invoice[];
  onBuatTagihan: (tenant: Tenant) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export default function TabTagihanTenant({ tenants, invoices, onBuatTagihan, onViewInvoice }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'baru' | 'riwayat'>('baru');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Data Tenant untuk Pembuatan Tagihan Baru
  const billableTenants = tenants.filter(t => t.status !== 'Non-aktif');
  const filteredTenants = billableTenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (tenant.email && tenant.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Data Riwayat Tagihan khusus untuk Tenant (Filter by CustomerType)
  const tenantInvoices = invoices.filter(inv => inv.customerType === 'Tenant');
  const filteredInvoices = tenantInvoices.filter(inv => 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider"><CheckCircle className="w-3 h-3"/> Lunas</span>;
      case 'PARTIAL': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider"><PieChart className="w-3 h-3"/> Sebagian</span>;
      case 'PENDING': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider"><Clock className="w-3 h-3"/> Menunggu</span>;
      case 'OVERDUE': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider"><AlertCircle className="w-3 h-3"/> Jatuh Tempo</span>;
      case 'CANCELLED': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider"><XCircle className="w-3 h-3"/> Dibatalkan</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header & Control Panel */}
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" /> Manajemen Penagihan Tenant
            </h2>
            <p className="text-sm text-slate-500 mt-1">Buat tagihan baru atau pantau riwayat pembayaran seluruh startup inkubator.</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'baru' ? "Cari nama tenant..." : "Cari no invoice atau tenant..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex gap-2 border-b border-slate-200 pb-px">
          <button 
            onClick={() => setActiveSubTab('baru')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'baru' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Building className="w-4 h-4" /> Daftar Tenant (Penerbitan Baru)
          </button>
          <button 
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeSubTab === 'riwayat' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <History className="w-4 h-4" /> Riwayat Tagihan & Pembayaran
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------- */}
      {/* KONTEN: BUAT TAGIHAN BARU                             */}
      {/* ----------------------------------------------------- */}
      {activeSubTab === 'baru' && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.length === 0 ? (
               <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                  <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">Tidak ada tenant yang ditemukan.</p>
               </div>
            ) : (
              filteredTenants.map(tenant => (
                <div key={tenant.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {tenant.logoUrl ? (
                        <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-black text-slate-300 text-lg">{tenant.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                        {tenant.name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider">
                        {tenant.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-1">
                    <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {tenant.email || 'Email belum diatur'}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {tenant.contact || 'Kontak belum diatur'}
                    </p>
                  </div>

                  <button 
                    onClick={() => onBuatTagihan(tenant)}
                    className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Buat Tagihan (Invoice) <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}


      {/* ----------------------------------------------------- */}
      {/* KONTEN: RIWAYAT TAGIHAN                               */}
      {/* ----------------------------------------------------- */}
      {activeSubTab === 'riwayat' && (
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">No. Invoice & Tanggal</th>
                <th className="px-6 py-4">Nama Startup / Tenant</th>
                <th className="px-6 py-4">Nominal Tagihan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <span className="font-bold">Belum ada riwayat tagihan tenant.</span>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{invoice.invoiceNumber}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3"/> {new Date(invoice.date).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{invoice.customerName}</p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{invoice.customerEmail || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-900">{formatRupiah(invoice.totalAmount)}</p>
                      {invoice.remainingAmount > 0 && invoice.status !== 'CANCELLED' && (
                         <p className="text-[10px] font-bold text-red-500 mt-0.5">Sisa: {formatRupiah(invoice.remainingAmount)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onViewInvoice(invoice)} 
                        className="px-3 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}