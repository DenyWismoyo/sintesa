"use client";

import React, { useState } from 'react';
import { ProductCatalog } from '@/types';
import { Edit, Trash2, Image as ImageIcon, Search, CheckCircle2, List, Plus, Loader2, Store, UserCheck } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface TabDaftarKatalogProps {
  products: ProductCatalog[];
  loading?: boolean;
  isFetchingDetail?: boolean;
  onAdd: () => void;
  onEdit: (product: ProductCatalog) => void;
  onDelete: (id: string) => void;
}

export default function TabDaftarKatalog({ products, loading, isFetchingDetail, onAdd, onEdit, onDelete }: TabDaftarKatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.tenantName && product.tenantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            type="text" 
            placeholder="Cari nama produk, kategori, atau nama tenant..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:bg-white transition-colors"
            disabled={isFetchingDetail}
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-slate-500 font-medium hidden sm:block">
            Menampilkan <span className="font-bold text-slate-700">{filteredProducts.length}</span> produk
          </div>
          <button 
            onClick={onAdd} 
            disabled={isFetchingDetail}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all"
          >
            <Plus className="h-4 w-4" /> Tambah Katalog
          </button>
        </div>
      </div>

      {/* Tambahan efek transisi saat sedang fetch detail agar UI terhindar dari double click */}
      <div className={`overflow-x-auto min-h-[400px] transition-opacity duration-300 ${isFetchingDetail ? 'opacity-60 pointer-events-none' : ''}`}>
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Produk / Layanan</th>
              <th className="px-6 py-4">Kepemilikan</th>
              <th className="px-6 py-4">Harga Sewa / Jual</th>
              <th className="px-6 py-4 text-center">Spesifikasi</th>
              <th className="px-6 py-4">Status Tampil</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" /> 
                  <span className="font-medium">Memuat data katalog...</span>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-medium">
                  Tidak ada produk yang cocok dengan pencarian Anda.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 aspect-video rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 transition-transform group-hover:scale-105 shadow-sm">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-400 h-5 w-5" />
                        )}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={product.name}>{product.name}</p>
                        <p className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 w-fit px-2.5 py-0.5 rounded-md mt-1">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.ownerType === 'TENANT' ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Store className="w-3 h-3"/> Milik Tenant
                        </span>
                        <p className="text-xs font-semibold text-slate-700 mt-1.5">{product.tenantName || 'Tenant Tidak Diketahui'}</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck className="w-3 h-3"/> Internal / BLUD
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800 text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">/ {product.pricingType}</p>
                    {product.isNegotiable && <span className="inline-block mt-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Bisa Nego</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                        <List className="h-3 w-3 mr-1.5 text-slate-400" /> {product.specifications?.length || 0} Spek
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md w-fit">
                        <CheckCircle2 className="h-3 w-3 mr-1.5 text-indigo-400" /> {product.highlights?.length || 0} Sorotan
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.isPublished ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Publik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div> Draft (Sembunyi)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(product)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm relative" 
                        title="Edit"
                      >
                         <Edit className={`h-4 w-4 ${isFetchingDetail ? 'opacity-0' : 'opacity-100'}`} />
                         {/* Indikator loading mikro tepat di tombol edit */}
                         {isFetchingDetail && <Loader2 className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
                      </button>
                      <button onClick={() => onDelete(product.id!)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Pagination dihapus karena kita menggunakan teknik Single-Page Cache List (Infinite tanpa scroll) */}

    </div>
  );
}