// Lokasi file: src/app/admin/tenant/components/TabDirektoriTenant.tsx
import React, { useState } from 'react';
import { Search, Loader2, Edit, Trash2, Building, Eye, Filter, ChevronDown, User, Activity } from 'lucide-react';
import { Tenant } from '@/types';

interface Props {
  tenants: Tenant[];
  loading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (id: string) => void;
  onViewProfile: (tenant: Tenant) => void;
}

export default function TabDirektoriTenant({ tenants, loading, fetchNextPage, hasNextPage, isFetchingNextPage, onEdit, onDelete, onViewProfile }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('Semua');
  const [filterSegment, setFilterSegment] = useState<string>('Semua');

  const filteredTenants = tenants.filter(tenant => {
    const matchSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        tenant.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        tenant.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = filterStage === 'Semua' || (tenant.pipelineStage || 'Pra-Inkubasi') === filterStage;
    const matchSegment = filterSegment === 'Semua' || tenant.segment === filterSegment;
    
    return matchSearch && matchStage && matchSegment;
  });

  const getHealthDotColor = (score?: string) => {
    if (score === 'Healthy') return 'bg-emerald-500 shadow-emerald-200';
    if (score === 'Warning') return 'bg-amber-500 shadow-amber-200';
    if (score === 'Critical') return 'bg-red-500 shadow-red-200 animate-pulse';
    return 'bg-slate-300';
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari startup atau UMKM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
          
          <select 
            value={filterSegment}
            onChange={e => setFilterSegment(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 text-sm font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="Semua">Semua Segmen</option>
            <option value="StartUp">StartUp Teknologi</option>
            <option value="UMKM">UMKM / IKM</option>
          </select>

          <select 
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 text-sm font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="Semua">Semua Tahapan (Pipeline)</option>
            <option value="Pra-Inkubasi">Pra-Inkubasi</option>
            <option value="Validasi Ide">Validasi Ide</option>
            <option value="Pengembangan Produk">Pengembangan Produk</option>
            <option value="Go-To-Market">Go-To-Market</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Profil Startup</th>
                <th className="px-6 py-4">Sektor Bisnis</th>
                <th className="px-6 py-4">Status & Tahap</th>
                <th className="px-6 py-4">Health Score</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <span className="font-bold">Memuat direktori...</span>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <span className="font-bold">Tidak ada startup yang sesuai.</span>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onViewProfile(tenant)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-300 transition-all">
                          {tenant.logoUrl ? <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" /> : <span className="font-black text-slate-300 text-xl">{tenant.name.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors tracking-tight">{tenant.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1.5"><User size={12}/> {tenant.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700">{tenant.sector}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-bold uppercase tracking-wider">{tenant.segment || 'StartUp'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800">{tenant.pipelineStage || 'Pra-Inkubasi'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {tenant.status}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getHealthDotColor(tenant.currentHealthScore)}`}></span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{tenant.currentHealthScore === 'Unknown' ? 'Belum Ada Data' : tenant.currentHealthScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onViewProfile(tenant)} className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-xl shadow-sm" title="Lihat Profil"><Eye size={16} /></button>
                        <button onClick={() => onEdit(tenant)} className="p-2 text-slate-500 hover:text-amber-600 bg-white border border-slate-200 rounded-xl shadow-sm" title="Edit Data"><Edit size={16} /></button>
                        <button onClick={() => onDelete(tenant.id!)} className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-xl shadow-sm" title="Hapus Permanen"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 gap-4">
          <span className="text-sm font-medium text-slate-500">Menampilkan <span className="font-bold text-slate-800">{filteredTenants.length}</span> tenant dimuat.</span>
          {hasNextPage && (
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
              {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <ChevronDown className="w-4 h-4" />} Muat Lainnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}