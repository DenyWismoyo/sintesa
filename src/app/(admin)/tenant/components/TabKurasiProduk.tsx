// Lokasi file: src/app/admin/tenant/components/TabKurasiProduk.tsx
import React, { useState } from 'react';
import { Search, ShieldCheck, Building, Package, ArrowRight, Filter, Star, AlertCircle } from 'lucide-react';
import { Tenant } from '@/types';

interface Props {
  tenants: Tenant[];
  onStartCuration: (tenant: Tenant) => void;
}

export default function TabKurasiProduk({ tenants, onStartCuration }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter khusus untuk menampilkan tenant dengan segmen UMKM atau Koperasi
  // (Sesuai cetak biru, fokus kurasi fisik ada di UKM)
  const ukmTenants = tenants.filter(t => t.segment === 'UMKM' || t.segment === 'Koperasi');
  
  const filteredTenants = ukmTenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tenant.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReadinessBadge = (level?: string) => {
    switch (level) {
      case 'Premium Export Ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Retail Ready': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Market Ready': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Development Needed': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Pre-Incubation': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Header & Control Panel */}
      <div className="p-6 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> Smart Curation System™
            </h2>
            <p className="text-sm text-slate-500 mt-1">Evaluasi produk fisik UKM untuk standarisasi ritel dan ekspor.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama UKM atau Pemilik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Tenant UKM */}
      <div className="p-6">
        {filteredTenants.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
             <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">Tidak ada data UKM yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map(tenant => (
              <div key={tenant.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {tenant.logoUrl ? (
                        <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight leading-tight group-hover:text-emerald-600 transition-colors">
                        {tenant.name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{tenant.sector}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">Status Inkubasi</span>
                    <span className="text-xs font-bold text-slate-800">{tenant.pipelineStage || 'Pre-Incubation'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">Level Kesiapan (UKM)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getReadinessBadge(tenant.smeReadinessLevel)}`}>
                      {tenant.smeReadinessLevel || 'Belum Dikurasi'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => onStartCuration(tenant)}
                  className="w-full py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" /> Mulai Kurasi Produk <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}