"use client";

import React, { useState, useMemo } from 'react';
import { ProductCatalog } from '@/types';
import { 
  Edit, Trash2, Image as ImageIcon, Plus, Loader2, Store, UserCheck, 
  CheckCircle2, List, Sparkles, Tag, Eye, EyeOff
} from 'lucide-react';
import { AdminFilterBar, AdminResponsiveView } from '@/components/admin';

interface TabDaftarKatalogProps {
  products: ProductCatalog[];
  loading?: boolean;
  isFetchingDetail?: boolean;
  onAdd: () => void;
  onEdit: (product: ProductCatalog) => void;
  onDelete: (id: string) => void;
}

export default function TabDaftarKatalog({
  products,
  loading = false,
  isFetchingDetail = false,
  onAdd,
  onEdit,
  onDelete
}: TabDaftarKatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');

  // Ekstrak kategori unik untuk filter
  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return [
      { value: 'ALL', label: 'Semua Kategori' },
      ...cats.map(c => ({ value: c, label: c }))
    ];
  }, [products]);

  const ownerOptions = [
    { value: 'ALL', label: 'Semua Pemilik' },
    { value: 'INTERNAL', label: 'Internal / BLUD' },
    { value: 'TENANT', label: 'Mitra Tenant' },
  ];

  // Filtering data
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.tenantName && product.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchOwner = selectedOwner === 'ALL' || product.ownerType === selectedOwner;

      return matchSearch && matchCategory && matchOwner;
    });
  }, [products, searchTerm, selectedCategory, selectedOwner]);

  return (
    <div className="space-y-4">
      {/* 1. ADMIN FILTER BAR */}
      <AdminFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama produk, kategori, atau nama tenant..."
        totalHits={filteredProducts.length}
        totalLabel="produk"
        filters={[
          {
            id: 'category',
            label: 'Kategori Produk',
            value: selectedCategory,
            options: categoryOptions,
            onChange: setSelectedCategory,
            icon: <Tag className="w-3.5 h-3.5" />
          },
          {
            id: 'owner',
            label: 'Kepemilikan',
            value: selectedOwner,
            options: ownerOptions,
            onChange: setSelectedOwner,
            icon: <Store className="w-3.5 h-3.5" />
          }
        ]}
        extraActions={
          <button
            onClick={onAdd}
            disabled={isFetchingDetail}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Katalog</span>
          </button>
        }
      />

      {/* 2. ADMIN RESPONSIVE VIEW (HYBRID TABLE / CARD VIEW) */}
      <AdminResponsiveView
        items={filteredProducts}
        loading={loading}
        emptyTitle="Tidak Ada Produk Ditemukan"
        emptyMessage={
          searchTerm || selectedCategory !== 'ALL' || selectedOwner !== 'ALL'
            ? 'Tidak ada produk yang sesuai dengan kriteria filter pencarian Anda.'
            : 'Belum ada produk atau layanan yang didaftarkan ke dalam E-Katalog.'
        }
        emptyAction={
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk Pertama
          </button>
        }
        // DESKTOP TABLE VIEW (≥ lg)
        renderDesktopTable={(items) => (
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-slate-50/80 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-150">
              <tr>
                <th className="px-5 py-3.5 w-[36%]">Produk / Layanan</th>
                <th className="px-5 py-3.5 w-[16%]">Kepemilikan</th>
                <th className="px-5 py-3.5 w-[16%]">Harga Sewa / Jual</th>
                <th className="px-5 py-3.5 w-[12%] text-center">Spesifikasi</th>
                <th className="px-5 py-3.5 w-[10%] text-center">Status</th>
                <th className="px-5 py-3.5 w-[10%] text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/80 group-hover:scale-105 transition-transform shadow-2xs">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-400 h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-md">
                        <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors" title={product.name}>
                          {product.name}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md mt-1">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {product.ownerType === 'TENANT' ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                          <Store className="w-3 h-3" /> Milik Tenant
                        </span>
                        <p className="text-xs font-semibold text-slate-700 mt-1 truncate max-w-[150px]">
                          {product.tenantName || 'Tenant'}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                        <UserCheck className="w-3 h-3" /> Internal / BLUD
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-black text-slate-800 text-sm">
                      Rp {product.price?.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">
                      / {product.pricingType || 'Satuan'}
                    </p>
                    {product.isNegotiable && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Bisa Nego
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                        <List className="h-3 w-3 mr-1 text-slate-400" /> {product.specifications?.length || 0} Spek
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md w-fit">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-indigo-400" /> {product.highlights?.length || 0} Sorotan
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {product.isPublished ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Publik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(product)}
                        disabled={isFetchingDetail}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs relative"
                        title="Edit Produk"
                      >
                        <Edit className={`h-4 w-4 ${isFetchingDetail ? 'opacity-0' : 'opacity-100'}`} />
                        {isFetchingDetail && (
                          <Loader2 className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-blue-600" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(product.id!)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        // MOBILE CARD VIEW (< lg)
        renderMobileCard={(product) => (
          <div className="space-y-3">
            {/* Top Bar: Image, Name, Status */}
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-slate-400 h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  {product.isPublished ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Eye className="w-3 h-3" /> Publik
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-800 text-sm mt-1 line-clamp-1" title={product.name}>
                  {product.name}
                </h4>
                <p className="text-xs font-bold text-blue-600 mt-0.5">
                  Rp {product.price?.toLocaleString('id-ID')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal uppercase">
                    / {product.pricingType || 'Unit'}
                  </span>
                </p>
              </div>
            </div>

            {/* Middle Bar: Kepemilikan & Fitur */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                {product.ownerType === 'TENANT' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Store className="w-3 h-3" /> {product.tenantName || 'Tenant'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <UserCheck className="w-3 h-3" /> BLUD STP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{product.specifications?.length || 0} Spek</span>
                <span>•</span>
                <span>{product.highlights?.length || 0} Sorotan</span>
              </div>
            </div>

            {/* Bottom Bar: Touch-Friendly Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onEdit(product)}
                disabled={isFetchingDetail}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Ubah Detail</span>
              </button>
              <button
                onClick={() => onDelete(product.id!)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors"
                title="Hapus Produk"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}