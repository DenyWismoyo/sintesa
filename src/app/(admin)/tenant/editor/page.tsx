'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { Tenant } from '@/types';
import ModalFormTenant from '../components/ModalFormTenant';
import { toast } from 'sonner';

function TenantEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');

  const { allTenants, loading, addTenant, updateTenant } = useTenants();
  const existingTenant = editId ? allTenants.find((t) => t.id === editId) || null : null;

  if (editId && loading && !existingTenant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Data Tenant...</p>
      </div>
    );
  }

  const handleSaveTenant = async (
    data: Partial<Tenant>,
    logoFile?: File | null,
    docFile?: File | null
  ) => {
    const res = editId
      ? await updateTenant(editId, data, logoFile, docFile)
      : await addTenant(data as Omit<Tenant, 'id' | 'createdAt'>, logoFile, docFile);

    if (res && !res.success) {
      toast.error('Gagal menyimpan data tenant: ' + res.error);
    } else {
      toast.success(editId ? 'Data tenant berhasil diperbarui!' : 'Tenant baru berhasil didaftarkan!');
      router.push(editId ? `/tenant/${editId}` : '/tenant');
    }
  };

  return (
    <div className="workspace-page-container animate-in fade-in duration-200">
      <div className="workspace-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={editId ? `/tenant/${editId}` : '/tenant'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{editId ? 'Kembali ke Workspace' : 'Kembali ke Direktori'}</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
              {editId ? `Edit Profil & Kontrak: ${existingTenant?.name || ''}` : 'Registrasi Tenant / Startup Baru'}
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              Kelola identitas usaha, tahapan inkubasi, kredensial akses portal, dan status investasi.
            </p>
          </div>
        </div>
      </div>

      <ModalFormTenant
        isOpen={true}
        onClose={() => router.push(editId ? `/tenant/${editId}` : '/tenant')}
        onSubmit={handleSaveTenant}
        initialData={existingTenant}
        asPage={true}
      />
    </div>
  );
}

export default function TenantEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TenantEditorContent />
    </Suspense>
  );
}

