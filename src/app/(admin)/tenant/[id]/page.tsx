'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, Edit3, Loader2, PackageCheck, Receipt, ShieldCheck } from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling';
import DrawerProfilTenant from '../components/DrawerProfilTenant';
import ModalKurasiProduk from '../components/ModalKurasiProduk';

function TenantWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = typeof params?.id === 'string' ? params.id : '';
  const initialMode = searchParams?.get('mode') === 'kurasi' ? 'kurasi' : 'profil';

  const [mode, setMode] = useState<'profil' | 'kurasi'>(initialMode);
  const { allTenants, loading } = useTenants();
  const { invoices } = useBilling();

  useEffect(() => {
    if (searchParams?.get('mode') === 'kurasi') {
      setMode('kurasi');
    }
  }, [searchParams]);

  const tenant = allTenants.find((t) => t.id === tenantId) || null;

  if (loading && !tenant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Workspace Tenant...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="workspace-page-container">
        <div className="workspace-card p-8 text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-black text-slate-800">Tenant Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Data tenant yang Anda cari mungkin telah dihapus atau ID tidak valid.</p>
          <Link
            href="/tenant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Direktori Tenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page-container animate-in fade-in duration-200">
      <div className="workspace-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/tenant"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Direktori Tenant</span>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
                {tenant.name}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                {tenant.pipelineStage || tenant.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              {tenant.sector} • PIC: {tenant.ownerName} ({tenant.contact})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setMode('profil')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'profil' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Workspace Inkubasi
            </button>
            <button
              type="button"
              onClick={() => setMode('kurasi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'kurasi' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" /> Kurasi Produk & Katalog
            </button>
          </div>

          <Link
            href={`/tenant/editor?id=${tenant.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Kontrak
          </Link>
          <Link
            href={`/billing/invoice/editor?tenantId=${tenant.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" /> Terbitkan Tagihan
          </Link>
        </div>
      </div>

      {mode === 'profil' ? (
        <DrawerProfilTenant
          tenant={tenant}
          isOpen={true}
          onClose={() => router.push('/tenant')}
          invoices={invoices}
          asPage={true}
        />
      ) : (
        <ModalKurasiProduk
          tenant={tenant}
          isOpen={true}
          onClose={() => setMode('profil')}
          asPage={true}
        />
      )}
    </div>
  );
}

export default function TenantWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TenantWorkspaceContent />
    </Suspense>
  );
}

