// Lokasi file: src/app/(admin)/manajemen-kurasi/components/TabProductQuickCuration.tsx
// Kurasi Cepat Produk Tenant & IKM Binaan untuk Promosi E-Katalog

'use client';

import React, { useState } from 'react';
import { useTenants } from '@/hooks/useTenants';
import { Tenant } from '@/types';
import {
  ShoppingBag,
  Search,
  Package,
  Building,
  Star,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import ModalKurasiProduk from '@/app/(admin)/tenant/components/ModalKurasiProduk';

export default function TabProductQuickCuration() {
  const { tenants = [], loading: isLoading } = useTenants();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filtered = tenants.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchName = t.name.toLowerCase().includes(term);
    const matchOwner = (t.ownerName || '').toLowerCase().includes(term);
    return matchName || matchOwner;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-emerald-600" /> Kurasi Produk Tenant & Promosi E-Katalog
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih tenant untuk mengurasi produk binaan, men-generate rekomendasi AI, dan menayangkan langsung ke Master E-Katalog publik.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari tenant / pemilik..."
            className="h-8.5 pl-8 text-xs bg-slate-50 rounded-xl"
          />
        </div>
      </div>

      {/* GRID TENANT UNTUK KURASI PRODUK */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-200">
          Memuat data tenant...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-2">
          <Package size={36} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">Tidak ada tenant ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                      {tenant.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {tenant.sector} • {tenant.segment || 'Startup'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 mb-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold text-[11px]">Level Kesiapan:</span>
                    <span className="font-extrabold text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                      {tenant.smeReadinessLevel || tenant.aiCurationData?.readinessLevel || 'Belum Dikurasi'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold text-[11px]">Status Inkubasi:</span>
                    <span className="font-bold text-slate-800 text-[11px]">{tenant.pipelineStage || 'Pra-Inkubasi'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTenant(tenant)}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
              >
                <Star size={14} /> Kurasi & Tayangkan Produk <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL KURASI PRODUK */}
      {selectedTenant && (
        <ModalKurasiProduk
          isOpen={Boolean(selectedTenant)}
          onClose={() => setSelectedTenant(null)}
          tenant={selectedTenant}
        />
      )}

    </div>
  );
}

