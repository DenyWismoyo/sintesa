"use client";

import { useState } from 'react';
import { AssetCondition } from '@/types';
import { 
  Search, Loader2, AlertTriangle, Eye, QrCode, Edit, Image as ImageIcon, 
  MapPin, ChevronLeft, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import { useAssetSearch } from '@/hooks/useAssetSearch';
import { AdminFilterBar, AdminResponsiveView } from '@/components/admin';

interface Props {
  selectedForPrint: string[];
  setSelectedForPrint: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenDetail: (asset: any) => void;
  onOpenForm: (asset: any | 'NEW') => void;
  onOpenQr: (asset: any) => void;
}

export default function TabDaftarAset({ 
  selectedForPrint, 
  setSelectedForPrint, 
  onOpenDetail, 
  onOpenForm, 
  onOpenQr 
}: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'Semua' | 'Komersial' | 'Inventaris'>('Semua');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterType, setFilterType] = useState<string>('Semua'); 
  const [filterCondition, setFilterCondition] = useState<'Semua' | AssetCondition>('Semua');
  const [filterLocation, setFilterLocation] = useState<string>('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  const { results: assets, totalHits, totalPages, loading, facets } = useAssetSearch({
    query: searchInput,
    category: filterCategory,
    type: filterType,
    condition: filterCondition,
    location: filterLocation,
    tab: activeTab,
    page: currentPage,
    perPage: 20
  });

  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedForPrint(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = [...selectedForPrint];
      assets.forEach((item: any) => { if (item.id && !newSelected.includes(item.id)) newSelected.push(item.id); });
      setSelectedForPrint(newSelected);
    } else {
      const currentPageIds = assets.map((item: any) => item.id);
      setSelectedForPrint(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const conditionColor = (cond: string) => {
    switch (cond) {
      case 'Baik': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rusak Ringan': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rusak Berat': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const statusColor = (st: string) => {
    switch (st) {
      case 'Tersedia': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Disewa': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pemeliharaan': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. SEGMENTED TABS UTAMA */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit">
        {(['Semua', 'Komersial', 'Inventaris'] as const).map((tab) => (
          <button 
            key={tab} 
            onClick={() => handleFilterChange(setActiveTab, tab)} 
            className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-white text-blue-700 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. ADMIN FILTER BAR */}
      <AdminFilterBar
        searchTerm={searchInput}
        onSearchChange={(v) => handleFilterChange(setSearchInput, v)}
        searchPlaceholder="Cari nama, merek, atau kode inventaris..."
        totalHits={totalHits}
        totalLabel="aset"
        filters={[
          {
            id: 'location',
            label: 'Lokasi Aset',
            value: filterLocation,
            options: [{ value: 'Semua', label: 'Semua Lokasi' }, ...facets.locations.map(l => ({ value: l, label: l }))],
            onChange: (v) => handleFilterChange(setFilterLocation, v),
            icon: <MapPin className="w-3.5 h-3.5" />
          },
          {
            id: 'category',
            label: 'Kategori',
            value: filterCategory,
            options: [{ value: 'Semua', label: 'Semua Kategori' }, ...facets.categories.map(c => ({ value: c, label: c }))],
            onChange: (v) => { handleFilterChange(setFilterCategory, v); setFilterType('Semua'); }
          },
          {
            id: 'condition',
            label: 'Kondisi Fisik',
            value: filterCondition,
            options: [{ value: 'Semua', label: 'Semua Kondisi' }, ...facets.conditions.map(c => ({ value: c, label: c }))],
            onChange: (v) => handleFilterChange(setFilterCondition, v)
          }
        ]}
      />

      {/* 3. ADMIN RESPONSIVE VIEW */}
      <AdminResponsiveView
        items={assets}
        loading={loading}
        emptyTitle="Aset Tidak Ditemukan"
        emptyMessage="Tidak ada aset yang cocok dengan kata kunci atau filter yang Anda pilih."
        // DESKTOP TABLE VIEW
        renderDesktopTable={(items) => (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80 border-b border-slate-150">
              <tr>
                <th className="px-4 py-3.5 w-[4%] text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 transition-all" 
                    checked={items.length > 0 && items.every((item: any) => item.id && selectedForPrint.includes(item.id))} 
                    onChange={handleSelectAllCurrent} 
                  />
                </th>
                <th className="px-5 py-3.5 w-[28%]">Merek & Informasi</th>
                <th className="px-5 py-3.5 w-[30%]">Nama Aset & Kategori</th>
                <th className="px-5 py-3.5 w-[18%]">Kondisi & Status</th>
                <th className="px-5 py-3.5 w-[8%] text-center">Keluhan</th>
                <th className="px-5 py-3.5 w-[12%] text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((asset: any) => {
                const hasReport = asset.unresolvedReportsCount > 0;
                return (
                  <tr key={asset.id} className={`hover:bg-slate-50/80 transition-colors ${selectedForPrint.includes(asset.id!) ? 'bg-blue-50/30' : ''} ${hasReport ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 transition-all" 
                        checked={selectedForPrint.includes(asset.id!)} 
                        onChange={() => handleToggleSelect(asset.id!)} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div onClick={() => onOpenDetail(asset)} className="flex items-center gap-3 cursor-pointer group" title="Klik untuk lihat detail">
                        <div className="w-14 h-10 shrink-0 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-xs">
                          {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-400" size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            {asset.brandType && asset.brandType !== '-' ? asset.brandType : 'Tanpa Merek'}
                            {hasReport && <span title="Ada Laporan Publik!" className="flex"><AlertTriangle size={15} className="text-red-500 animate-pulse" /></span>}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md">{asset.inventoryNumber}</span>
                            {asset.registerNumber && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">REG: {asset.registerNumber}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div onClick={() => onOpenDetail(asset)} className="cursor-pointer group">
                        <div className="text-slate-800 font-bold mb-1 group-hover:text-blue-600 transition-colors">{asset.name}</div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">{asset.category}</span>
                          {asset.assetType && asset.assetType !== '-' && <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{asset.assetType}</span>}
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-500" /> {asset.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${conditionColor(asset.condition)}`}>
                          {asset.condition}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${statusColor(asset.status)}`}>
                          {asset.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {hasReport ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                          {asset.unresolvedReportsCount} Laporan
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onOpenDetail(asset)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs" title="Lihat Detail & Laporan"><Eye size={14} /></button>
                        <button onClick={() => onOpenQr(asset)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs" title="QR Code Aset"><QrCode size={14} /></button>
                        <button onClick={() => onOpenForm(asset)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs" title="Edit Aset"><Edit size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        // MOBILE CARD VIEW
        renderMobileCard={(asset: any) => {
          const hasReport = asset.unresolvedReportsCount > 0;
          const isSelected = selectedForPrint.includes(asset.id!);
          return (
            <div className="space-y-3">
              {/* Header Card: Checkbox, Foto, Title, Merek */}
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 mt-1 transition-all shrink-0" 
                  checked={isSelected} 
                  onChange={() => handleToggleSelect(asset.id!)} 
                />
                <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    {hasReport && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> {asset.unresolvedReportsCount} Laporan
                      </span>
                    )}
                  </div>
                  <h4 
                    onClick={() => onOpenDetail(asset)}
                    className="font-bold text-slate-800 text-sm mt-1 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {asset.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {asset.inventoryNumber}
                  </p>
                </div>
              </div>

              {/* Badges & Lokasi */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                  <MapPin size={12} className="text-blue-500 shrink-0" />
                  <span className="truncate">{asset.location || 'Kawasan STP'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${conditionColor(asset.condition)}`}>
                    {asset.condition}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => onOpenDetail(asset)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Detail</span>
                </button>
                <button
                  onClick={() => onOpenQr(asset)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>QR Code</span>
                </button>
                <button
                  onClick={() => onOpenForm(asset)}
                  className="flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
              </div>
            </div>
          );
        }}
        // PAGINATION
        pagination={
          totalPages > 1 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-700">{totalHits}</span> aset
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 shadow-xs transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs sm:text-sm font-bold text-slate-700 px-3">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages || loading}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 shadow-xs transition-all"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}