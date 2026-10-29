'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useFinance } from '@/hooks/useFinance';
import { useTenants } from '@/hooks/useTenants';
import { Invoice } from '@/types';
import ModalFormInvoice from '../../component/ModalFormInvoice';
import { toast } from 'sonner';

function InvoiceEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');
  const tenantId = searchParams?.get('tenantId');

  const { invoices, loading, createNewInvoice, updateInvoice } = useBilling();
  const { accounts } = useFinance();
  const { allTenants } = useTenants();

  const existingInvoice = editId ? invoices.find((inv) => inv.id === editId) || null : null;
  const targetTenant = tenantId ? allTenants.find((t) => t.id === tenantId) || null : null;

  const initialDraft: Partial<Invoice> | null = existingInvoice
    ? existingInvoice
    : targetTenant
    ? {
        customerType: 'Tenant',
        tenantId: targetTenant.id,
        customerName: targetTenant.name,
        customerEmail: targetTenant.email || '',
        customerPhone: targetTenant.contact || '',
        items: [
          {
            id: Date.now().toString(),
            referenceType: 'TENANT',
            referenceId: targetTenant.id,
            description: `Biaya Sewa / Layanan Inkubasi Tenant (${targetTenant.name})`,
            quantity: 1,
            unitPrice: 0,
            total: 0,
          },
        ],
      }
    : null;

  if (loading && editId && !existingInvoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Dokumen Tagihan...</p>
      </div>
    );
  }

  const handleSave = async (data: Partial<Invoice>) => {
    const res = editId
      ? await updateInvoice(editId, data)
      : await createNewInvoice(data as Omit<Invoice, 'id'>);

    if (res && !res.success) {
      toast.error('Gagal menyimpan tagihan: ' + res.error);
    } else {
      toast.success(editId ? 'Tagihan berhasil diperbarui!' : 'Tagihan baru berhasil diterbitkan!');
      router.push(tenantId ? `/tenant/${tenantId}` : '/billing');
    }
  };

  return (
    <div className="workspace-page-container animate-in fade-in duration-200">
      <div className="workspace-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={tenantId ? `/tenant/${tenantId}` : '/billing'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs sm:text-sm font-bold transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tenantId ? 'Kembali ke Workspace Tenant' : 'Kembali ke Sistem Billing'}</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
              {editId ? `Revisi Tagihan: ${existingInvoice?.invoiceNumber || ''}` : 'Studio Penerbitan Tagihan (Invoice)'}
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              Susun rincian item tagihan, kalkulasi pajak PPN/PPh, termin pembayaran, dan rekening bank tujuan.
            </p>
          </div>
        </div>
      </div>

      <ModalFormInvoice
        asPage={true}
        onClose={() => router.push(tenantId ? `/tenant/${tenantId}` : '/billing')}
        onSubmit={handleSave}
        initialData={initialDraft as Invoice}
        invoices={invoices || []}
        accounts={accounts || []}
      />
    </div>
  );
}

export default function InvoiceEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <InvoiceEditorContent />
    </Suspense>
  );
}
