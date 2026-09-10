import { useState } from 'react';
import { AssetCondition } from '@/types';
import { Search, Loader2, AlertTriangle, Eye, QrCode, Edit, Image as ImageIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAssetSearch } from '@/hooks/useAssetSearch';

interface Props {
  selectedForPrint: string[];
  setSelectedForPrint: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenDetail: (asset: any) => void;
  onOpenForm: (asset: any | 'NEW') => void;
  onOpenQr: (asset: any) => void;
}

export default function TabDaftarAset({ selectedForPrint, setSelectedForPrint, onOpenDetail, onOpenForm, onOpenQr }: Props) {
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Area Filter - Clean styling */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, merek, atau kode..." 
            value={searchInput} 
            onChange={(e) => handleFilterChange(setSearchInput, e.target.value)} 
            className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition-all" 
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['Semua', 'Komersial', 'Inventaris'] as const).map((tab) => (
              <button key={tab} onClick={() => handleFilterChange(setActiveTab, tab)} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
            ))}
          </div>
          
          <select value={filterLocation} onChange={(e) => handleFilterChange(setFilterLocation, e.target.value)} className="px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-700 max-w-[130px] truncate transition-colors">
            <option value="Semua">Semua Lokasi</option>
            {facets.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select value={filterCategory} onChange={(e) => { handleFilterChange(setFilterCategory, e.target.value); setFilterType('Semua'); }} className="px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-700 max-w-[130px] truncate transition-colors">
            <option value="Semua">Semua Kategori</option>
            {facets.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select value={filterType} onChange={(e) => handleFilterChange(setFilterType, e.target.value)} className="px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-700 max-w-[130px] truncate transition-colors">
            <option value="Semua">Semua Jenis</option>
            {facets.types.map(type => <option key={type} value={type}>{type}</option>)}
          </select>

          <select value={filterCondition} onChange={(e) => handleFilterChange(setFilterCondition, e.target.value as any)} className="px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-700 max-w-[130px] truncate transition-colors">
            <option value="Semua">Semua Kondisi</option>
            {facets.conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 font-semibold bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 transition-all" checked={assets.length > 0 && assets.every((item: any) => item.id && selectedForPrint.includes(item.id))} onChange={handleSelectAllCurrent} />
                </th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Merek & Informasi</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nama Aset & Kategori</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Kondisi & Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Keluhan</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && assets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" /> Mencari data di server...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-500">Aset tidak ditemukan dalam pencarian.</td></tr>
              ) : (
                assets.map((asset: any) => {
                  const hasReport = asset.unresolvedReportsCount > 0;
                  return (
                    <tr key={asset.id} className={`hover:bg-slate-50/80 transition-colors ${selectedForPrint.includes(asset.id!) ? 'bg-blue-50/30' : ''} ${hasReport ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4 transition-all" checked={selectedForPrint.includes(asset.id!)} onChange={() => handleToggleSelect(asset.id!)} />
                      </td>
                      <td className="px-6 py-4">
                        <div onClick={() => onOpenDetail(asset)} className="flex items-center gap-3 cursor-pointer group" title="Klik untuk lihat detail">
                          <div className="h-11 w-11 shrink-0 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-md">
                            {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-400" size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                              {asset.brandType && asset.brandType !== '-' ? asset.brandType : 'Tanpa Merek'}
                              {hasReport && <span title="Ada Laporan Publik!" className="flex"><AlertTriangle size={16} className="text-red-500 animate-pulse" /></span>}
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
                        {/* Soft Badges */}
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${asset.condition === 'Baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : asset.condition === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {asset.condition}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${asset.status === 'Tersedia' ? 'bg-blue-50 text-blue-700 border-blue-100' : asset.status === 'Disewa' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {asset.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {hasReport ? (
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">{asset.unresolvedReportsCount} Laporan</span>
                         ) : (
                            <span className="text-xs text-slate-400 font-medium italic">-</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onOpenDetail(asset)} className="text-slate-500 hover:text-blue-600 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm" title="Lihat Detail & Laporan"><Eye size={16} /></button>
                          <button onClick={() => onOpenQr(asset)} className="text-slate-500 hover:text-slate-700 p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm" title="QR Code Aset"><QrCode size={16} /></button>
                          <button onClick={() => onOpenForm(asset)} className="text-blue-500 hover:text-blue-700 p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm" title="Edit Aset"><Edit size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PAGINATION */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <span className="text-sm text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-700">{totalHits}</span> aset
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1 || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 shadow-sm transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-slate-700 px-3">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 shadow-sm transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}