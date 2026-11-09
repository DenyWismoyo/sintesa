// Lokasi file: src/app/admin/tenant/components/TabDirektoriTenant.tsx
import React, { useState } from 'react';
import { Loader2, Edit, Trash2, Building, Eye, ChevronDown, User } from 'lucide-react';
import { Tenant } from '@/types';
import { AdminFilterBar, AdminResponsiveView, AdminMobileCard } from '@/components/admin';

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
      {/* Toolbar Filter */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari startup, founder, atau sektor usaha..."
        filters={[
          {
            id: 'segment',
            value: filterSegment,
            onChange: setFilterSegment,
            options: [
              { label: 'Semua Segmen', value: 'Semua' },
              { label: 'StartUp Teknologi', value: 'StartUp' },
              { label: 'UMKM / IKM', value: 'UMKM' },
            ],
          },
          {
            id: 'stage',
            value: filterStage,
            onChange: setFilterStage,
            options: [
              { label: 'Semua Tahapan (Pipeline)', value: 'Semua' },
              { label: 'Pra-Inkubasi', value: 'Pra-Inkubasi' },
              { label: 'Validasi Ide', value: 'Validasi Ide' },
              { label: 'Pengembangan Produk', value: 'Pengembangan Produk' },
              { label: 'Go-To-Market', value: 'Go-To-Market' },
              { label: 'Alumni', value: 'Alumni' },
            ],
          },
        ]}
        hasActiveFilters={Boolean(searchTerm || filterSegment !== 'Semua' || filterStage !== 'Semua')}
        onReset={() => {
          setSearchTerm('');
          setFilterSegment('Semua');
          setFilterStage('Semua');
        }}
      />

      {/* Table & Mobile Card Data */}
      <div className="space-y-3">
        <AdminResponsiveView<Tenant>
          items={filteredTenants}
          isLoading={loading && tenants.length === 0}
          emptyTitle="Tidak ada startup yang sesuai"
          emptyMessage="Belum ada data tenant yang sesuai dengan filter pencarian Anda."
          renderDesktopTable={(items) => (
            <table className="w-full min-w-[700px] text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-150 font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 w-[35%]">Profil Startup</th>
                  <th className="px-5 py-3.5 w-[20%]">Sektor Bisnis</th>
                  <th className="px-5 py-3.5 w-[18%]">Status & Tahap</th>
                  <th className="px-5 py-3.5 w-[15%]">Health Score</th>
                  <th className="px-5 py-3.5 w-[12%] text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => onViewProfile(tenant)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-blue-300 transition-all shadow-2xs">
                          {tenant.logoUrl ? <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" /> : <span className="font-black text-slate-300 text-lg">{tenant.name.charAt(0)}</span>}
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors tracking-tight truncate">{tenant.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1.5 truncate"><User size={11}/> {tenant.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-700 text-xs">{tenant.sector}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-bold uppercase tracking-wider">{tenant.segment || 'StartUp'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 text-xs">{tenant.pipelineStage || 'Pra-Inkubasi'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Status: {tenant.status}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getHealthDotColor(tenant.currentHealthScore)}`}></span>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{tenant.currentHealthScore === 'Unknown' ? 'Belum Ada Data' : tenant.currentHealthScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onViewProfile(tenant)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg shadow-2xs" title="Lihat Profil"><Eye size={14} /></button>
                        <button onClick={() => onEdit(tenant)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-white border border-slate-200 rounded-lg shadow-2xs" title="Edit Data"><Edit size={14} /></button>
                        <button onClick={() => onDelete(tenant.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-lg shadow-2xs" title="Hapus Permanen"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          renderMobileCard={(tenant) => (
            <AdminMobileCard
              title={tenant.name}
              subtitle={`${tenant.ownerName} • ${tenant.sector}`}
              badge={
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[9px] font-bold uppercase">
                  {tenant.segment || 'StartUp'}
                </span>
              }
              fields={[
                { label: 'Tahap Pipeline', value: tenant.pipelineStage || 'Pra-Inkubasi' },
                { label: 'Status', value: tenant.status },
                {
                  label: 'Health Score',
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getHealthDotColor(tenant.currentHealthScore)}`} />
                      {tenant.currentHealthScore === 'Unknown' ? 'Belum Ada Data' : tenant.currentHealthScore}
                    </span>
                  ),
                },
              ]}
              footer={
                <div className="flex items-center justify-end gap-1.5 w-full">
                  <button onClick={() => onViewProfile(tenant)} className="px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"><Eye size={13} /> Profil</button>
                  <button onClick={() => onEdit(tenant)} className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg"><Edit size={14} /></button>
                  <button onClick={() => onDelete(tenant.id!)} className="p-1.5 text-red-600 bg-white border border-red-200 rounded-lg"><Trash2 size={14} /></button>
                </div>
              }
            />
          )}
        />

        <div className="px-5 py-3.5 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Menampilkan <span className="font-bold text-slate-800">{filteredTenants.length}</span> tenant dimuat.</span>
          {hasNextPage && (
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors disabled:opacity-50">
              {isFetchingNextPage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5" />} Muat Lainnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}