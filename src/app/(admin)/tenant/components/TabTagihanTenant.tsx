import React, { useState } from 'react';
import { Search, Receipt, Building, Mail, Phone, ArrowRight, History } from 'lucide-react';
import { Tenant, Invoice } from '@/types';
import DivisionInvoiceTracker from '@/components/finance/DivisionInvoiceTracker';

interface Props {
  tenants: Tenant[];
  invoices: Invoice[];
  onBuatTagihan: (tenant: Tenant) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export default function TabTagihanTenant({ tenants, onBuatTagihan }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'baru' | 'riwayat'>('baru');
  const [searchTerm, setSearchTerm] = useState('');

  // Data Tenant untuk Pembuatan Tagihan Baru
  const billableTenants = tenants.filter(t => t.status !== 'Non-aktif');
  const filteredTenants = billableTenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (tenant.email && tenant.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header & Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" /> Manajemen Penagihan Tenant
            </h2>
            <p className="text-sm text-slate-500 mt-1">Buat tagihan sewa/inkubasi baru atau pantau riwayat pembayaran seluruh startup binaan.</p>
          </div>

          {activeSubTab === 'baru' && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          )}
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
            <History className="w-4 h-4" /> Monitoring Tagihan & Kwitansi (Terpadu)
          </button>
        </div>

        {activeSubTab === 'baru' && (
          <div className="py-6">
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
      </div>

      {/* KONTEN: RIWAYAT TAGIHAN TERPADU */}
      {activeSubTab === 'riwayat' && (
        <DivisionInvoiceTracker
          division="INKUBASI_TENANT"
          title="Pantauan Tagihan Sewa & Inkubasi Tenant"
          subtitle="Pantau pelunasan sewa ruang kantor, biaya inkubasi, unduh Invoice PDF, dan cetak Kwitansi resmi."
        />
      )}

    </div>
  );
}
