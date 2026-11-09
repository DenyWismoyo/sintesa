'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { useFinance } from '@/hooks/useFinance';
import { useAuth } from '@/lib/AuthContext';
import { APP_ROLES, canPerformAction, PERMISSIONS } from '@/config/roles';
import { Invoice, Expense, Account } from '@/types';
import { Toaster, toast } from 'sonner';

import {
  Plus,
  Receipt,
  Loader2,
  PieChart,
  LayoutDashboard,
  WalletCards,
  Landmark,
  Network,
  Download,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';
import { useAdminTab } from '@/hooks/useAdminTab';

import StatCardBilling from './component/StatCardBilling';
import TabInvoices from './component/TabInvoices';
import ModalFormInvoice from './component/ModalFormInvoice';
import ModalInvoiceDetail from './component/ModalInvoiceDetail';
import ModalFormPayment from './component/ModalFormPayment';
import PrintInvoiceLayout from './component/PrintInvoiceLayout';
import ModalAllocateInvoice from './component/ModalAllocateInvoice';

// IMPORT KOMPONEN KWITANSI BARU
import PrintKwitansiLayout, { downloadKwitansiPDF } from './component/PrintKwitansiLayout';
import ModalPreviewKwitansi from './component/ModalPreviewKwitansi';

import TabExpenses from './component/TabExpenses';
import ModalFormExpense from './component/ModalFormExpense';
import TabCashBank from './component/TabCashBank';
import TabReports from './component/TabReports';
import TabLaporanAlokasi from './component/TabLaporanAlokasi';
import TabExport from './component/TabExport';
import TabKonfirmasi from './component/TabKonfirmasi';

// IMPORT KOMPONEN AGING PIUTANG, PROFIT CENTER & CASH FLOW
import TabAgingPiutang from './component/TabAgingPiutang';
import TabProfitCenter from './component/TabProfitCenter';
import TabCashFlow from './component/TabCashFlow';

import ModalFormTransfer from './component/ModalFormTransfer';
import ModalFormAccount from './component/ModalFormAccount';
import ModalBankReconciliation from './component/ModalBankReconciliation';

export default function BillingPage() {
  const { role } = useAuth();

  const isKasirPendapatan = role === APP_ROLES.KASIR;
  const isKasirPengeluaran = role === APP_ROLES.KASIR_PENGELUARAN;
  const isRestrictedStaff = isKasirPendapatan || isKasirPengeluaran;

  const {
    invoices,
    loading: billingLoading,
    createNewInvoice,
    updateInvoice,
    recordPayment,
    allocateInvoice,
  } = useBilling();
  const {
    expenses,
    accounts,
    journals,
    loading: financeLoading,
    createNewExpense,
    updateExpenseStatus,
    createAccount,
    transferKas,
  } = useFinance();

  const isLoading = billingLoading || financeLoading;

  // MENGHITUNG JUMLAH BUKTI YANG PERLU DIVERIFIKASI UNTUK BADGE
  const pendingVerificationsCount =
    invoices?.filter(
      (inv) =>
        inv.status !== 'PAID' &&
        inv.status !== 'CANCELLED' &&
        inv.history &&
        inv.history.some((h: any) => h.status === 'PENDING')
    ).length || 0;

  const ALL_VIEWS = useMemo(
    () => [
      {
        id: 'DASHBOARD',
        label: 'Dasbor',
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'INCOME',
        label: 'Pendapatan',
        icon: <WalletCards className="w-3.5 h-3.5" />,
        allowed: !isKasirPengeluaran,
      },
      {
        id: 'KONFIRMASI',
        label: 'Verifikasi Bayar',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        allowed: !isKasirPengeluaran,
        badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
      },
      {
        id: 'EXPENSE',
        label: 'Pengeluaran',
        icon: <Receipt className="w-3.5 h-3.5" />,
        allowed: !isKasirPendapatan,
      },
      {
        id: 'AGING_PIUTANG',
        label: 'Umur Piutang',
        icon: <PieChart className="w-3.5 h-3.5" />,
        allowed: !isKasirPengeluaran,
      },
      {
        id: 'PROFIT_CENTER',
        label: 'Laba/Rugi Divisi',
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'CASH_FLOW',
        label: 'Arus Kas',
        icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'CASH',
        label: 'Kas & Bank',
        icon: <Landmark className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'REKAP_ALOKASI',
        label: 'Rekap Alokasi',
        icon: <Network className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'REPORT',
        label: 'Buku Besar',
        icon: <PieChart className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
      {
        id: 'EXPORT',
        label: 'Pusat Ekspor',
        icon: <Download className="w-3.5 h-3.5" />,
        allowed: !isRestrictedStaff,
      },
    ],
    [isRestrictedStaff, isKasirPengeluaran, isKasirPendapatan, pendingVerificationsCount]
  );

  const VISIBLE_VIEWS = useMemo(() => ALL_VIEWS.filter((v) => v.allowed), [ALL_VIEWS]);
  const allowedTabIds = useMemo(() => VISIBLE_VIEWS.map((v) => v.id), [VISIBLE_VIEWS]);

  const defaultTab = isKasirPendapatan ? 'INCOME' : isKasirPengeluaran ? 'EXPENSE' : 'DASHBOARD';
  const [mainView, setMainView] = useAdminTab<string>(defaultTab, allowedTabIds);

  const [activeInvoiceTab] = useState('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  // STATES UNTUK KWITANSI
  const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
  const [selectedKwitansiInvoice, setSelectedKwitansiInvoice] = useState<Invoice | null>(null);
  const [printingKwitansiPayment, setPrintingKwitansiPayment] = useState<any | null>(null);
  const [kwitansiPenyetor, setKwitansiPenyetor] = useState('');
  const [kwitansiPenerima, setKwitansiPenerima] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [allocatingInvoice, setAllocatingInvoice] = useState<Invoice | null>(null);

  const [pendingVerificationItem, setPendingVerificationItem] = useState<any>(null);

  const [activeExpenseTab] = useState('ALL');
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isReconOpen, setIsReconOpen] = useState(false);

  const [processingId] = useState<string | null>(null);
  const [targetPAD, setTargetPAD] = useState<number>(1000000000);

  useEffect(() => {
    if (selectedInvoice && selectedInvoice.id) {
      const latestInvoice = invoices.find((inv) => inv.id === selectedInvoice.id);
      if (latestInvoice && JSON.stringify(latestInvoice) !== JSON.stringify(selectedInvoice)) {
        setSelectedInvoice(latestInvoice);
        if (printingInvoice?.id === latestInvoice.id) setPrintingInvoice(latestInvoice);
      }
    }
  }, [invoices, selectedInvoice, printingInvoice]);

  const handleOpenDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPrintingInvoice(invoice);
    setIsDetailOpen(true);
  };
  const handleOpenEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };
  const handleOpenAllocate = (invoice: Invoice) => {
    setAllocatingInvoice(invoice);
    setIsAllocateOpen(true);
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPendingVerificationItem(null);
    setIsDetailOpen(false);
    setTimeout(() => setIsPaymentOpen(true), 150);
  };

  const handleOpenKwitansiModal = (invoice: Invoice) => {
    setSelectedKwitansiInvoice(invoice);
    setIsDetailOpen(false);
    setTimeout(() => setIsKwitansiModalOpen(true), 150);
  };

  const handleProcessPrintKwitansi = async (
    invoice: Invoice,
    payment: any,
    penyetor: string,
    penerima: string
  ) => {
    const toastId = toast.loading('Memproses Kwitansi PDF...');
    setPrintingKwitansiPayment(payment);
    setSelectedKwitansiInvoice(invoice);
    setKwitansiPenyetor(penyetor);
    setKwitansiPenerima(penerima);

    setTimeout(async () => {
      await downloadKwitansiPDF(invoice.invoiceNumber, payment.id, () => {
        toast.success('Kwitansi siap diunduh!', { id: toastId });
      });
    }, 500);
  };

  const handleVerifyPendingProof = (invoice: Invoice, historyItem: any) => {
    setSelectedInvoice(invoice);
    setPendingVerificationItem(historyItem);
    setIsDetailOpen(false);
    setTimeout(() => setIsPaymentOpen(true), 150);
  };

  const handleRejectPendingProof = async (invoice: Invoice, historyId: string) => {
    const confirmReject = confirm('Apakah Anda yakin ingin menolak bukti transfer ini?');
    if (!confirmReject) return;

    const toastId = toast.loading('Menolak bukti...');
    try {
      const updatedHistory = invoice.history.map((h: any) =>
        h.id === historyId ? { ...h, status: 'FAILED' } : h
      );
      await updateInvoice(invoice.id!, { history: updatedHistory });
      toast.success('Bukti ditolak.', { id: toastId });
    } catch {
      toast.error('Gagal menolak bukti.', { id: toastId });
    }
  };

  const handleAllocateSubmit = async (
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    coaId: string,
    coaName: string
  ) => {
    await allocateInvoice(invoiceId, invoiceNumber, amount, coaId, coaName);
    toast.success('Alokasi berhasil & Jurnal Pendapatan tercatat!');
    setIsAllocateOpen(false);
  };

  const handleFormSubmit = async (data: Partial<Invoice>) => {
    const toastId = toast.loading('Memproses...');
    if (editingInvoice && editingInvoice.id) {
      await updateInvoice(editingInvoice.id, {
        ...data,
        remainingAmount:
          (data.totalAmount ?? editingInvoice.totalAmount) - editingInvoice.paidAmount,
      });
      setIsFormOpen(false);
      setEditingInvoice(null);
      toast.success('Selesai', { id: toastId });
    } else {
      await createNewInvoice(data as Omit<Invoice, 'id'>);
      setIsFormOpen(false);
      setEditingInvoice(null);
      toast.success('Tagihan diterbitkan', { id: toastId });
    }
  };

  const handlePaymentSubmit = async (
    invoiceId: string,
    amount: number,
    accountId: string,
    accountName: string,
    file: File | null,
    pendingHistoryId?: string
  ) => {
    if (!selectedInvoice) return;
    const toastId = toast.loading('Mencatat Pembayaran & Jurnal Kas...');

    try {
      setIsPaymentOpen(false);
      setPendingVerificationItem(null);
      setTimeout(() => setIsDetailOpen(true), 150);

      await recordPayment(
        invoiceId,
        selectedInvoice,
        amount,
        accountId,
        accountName,
        file,
        pendingHistoryId
      );
      toast.success('Pembayaran berhasil dicatat', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Gagal mencatat pembayaran', { id: toastId });
    }
  };

  const handleCancelInvoice = async (invoice: Invoice, reason: string) => {
    const toastId = toast.loading('Membatalkan & Membuat Jurnal Pembalik...');
    try {
      const newNotes = (invoice.notes || '') + `\n\n[DIBATALKAN] Alasan: ${reason}`;
      await updateInvoice(invoice.id!, { status: 'CANCELLED', notes: newNotes.trim() }, invoice);
      setIsDetailOpen(false);
      toast.success('Tagihan dibatalkan', { id: toastId });
    } catch {
      toast.error('Gagal membatalkan', { id: toastId });
    }
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    const newItems = invoice.items.map((item) => ({
      ...item,
      id: Math.random().toString(36).substring(7),
    }));
    const duplicateData: Partial<Invoice> = {
      ...invoice,
      id: undefined,
      invoiceNumber: undefined,
      status: 'PENDING',
      paidAmount: 0,
      remainingAmount: invoice.totalAmount,
      history: [],
      items: newItems,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setEditingInvoice(duplicateData as any);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleExpenseSubmit = async (data: Omit<Expense, 'id'>, file: File | null) => {
    const toastId = toast.loading('Mengajukan beban...');
    await createNewExpense(data, file);
    setIsExpenseFormOpen(false);
    toast.success('Berhasil', { id: toastId });
  };
  const handleExpenseStatusUpdate = async (expense: Expense, newStatus: Expense['status']) => {
    const toastId = toast.loading('Memproses Otorisasi...');
    await updateExpenseStatus(expense, newStatus);
    toast.success('Status diperbarui', { id: toastId });
  };
  const handleTransferSubmit = async (
    srcId: string,
    srcName: string,
    dstId: string,
    dstName: string,
    amount: number,
    note: string,
    date: string
  ) => {
    await transferKas(srcId, srcName, dstId, dstName, amount, note, date);
    setIsTransferOpen(false);
    toast.success('Selesai');
  };
  const handleAccountSubmit = async (data: Omit<Account, 'id'>) => {
    await createAccount(data);
    setIsAccountFormOpen(false);
    toast.success('Selesai');
  };

  return (
    <div className="space-y-5 pb-20 animate-in fade-in">
      <div className={isFormOpen ? 'hidden' : 'space-y-5'}>
        <Toaster position="top-center" richColors closeButton />

        <PrintInvoiceLayout invoice={printingInvoice} accounts={accounts || []} />
        <PrintKwitansiLayout
          invoice={selectedKwitansiInvoice}
          payment={printingKwitansiPayment}
          penyetorName={kwitansiPenyetor}
          penerimaName={kwitansiPenerima}
        />

        {/* 1. ADMIN PAGE HEADER (Tersinkronisasi dengan Pintasan Sidebar) */}
        <AdminPageHeader
          title={
            isKasirPendapatan
              ? 'Manajemen Penagihan (AR)'
              : isKasirPengeluaran
              ? 'Manajemen Pengeluaran (AP)'
              : 'Sistem Keuangan & Billing'
          }
          subtitle={
            isKasirPendapatan
              ? 'Kelola tagihan pelanggan, verifikasi bukti transfer, dan penerbitan kwitansi resmi.'
              : isKasirPengeluaran
              ? 'Ajukan pencairan dana dan catat bukti transaksi belanja BLUD.'
              : 'Sistem Penagihan, Rekonsiliasi Kas, dan Akuntansi Otomatis berbasis Cloud.'
          }
          badge={
            pendingVerificationsCount > 0
              ? `${pendingVerificationsCount} Perlu Verifikasi Bukti`
              : `${invoices?.length || 0} Invoice`
          }
          breadcrumbs={[{ label: 'Komersial' }, { label: 'Billing & Invoice' }]}
          actions={
            <div className="flex items-center flex-wrap gap-2">
              {!isKasirPengeluaran && (
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Terbitkan Invoice</span>
                </button>
              )}
              {!isKasirPendapatan && (
                <button
                  onClick={() => setIsExpenseFormOpen(true)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Receipt size={15} className="text-rose-600" />
                  <span>Catat Pengeluaran</span>
                </button>
              )}
            </div>
          }
          tabs={VISIBLE_VIEWS}
          activeTab={mainView}
          onTabChange={setMainView}
        />

        {isLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {mainView === 'DASHBOARD' && !isRestrictedStaff && (
              <StatCardBilling
                invoices={invoices || []}
                targetPAD={targetPAD}
                onUpdateTargetPAD={setTargetPAD}
              />
            )}

            {mainView === 'INCOME' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 sm:p-3 overflow-hidden">
                <TabInvoices
                  rawInvoices={invoices || []}
                  activeTab={activeInvoiceTab}
                  onGenerateLink={() => {}}
                  processingId={processingId}
                  onViewDetail={handleOpenDetail}
                  onEditInvoice={handleOpenEdit}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onAllocateBAS={isKasirPendapatan ? undefined : handleOpenAllocate}
                  onOpenAdd={() => {
                    setEditingInvoice(null);
                    setIsFormOpen(true);
                  }}
                  onOpenKwitansi={handleOpenKwitansiModal}
                />
              </div>
            )}

            {mainView === 'KONFIRMASI' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 sm:p-3 overflow-hidden">
                <TabKonfirmasi
                  invoices={invoices || []}
                  accounts={accounts || []}
                  onVerifyPending={handleVerifyPendingProof}
                  onRejectPending={handleRejectPendingProof}
                />
              </div>
            )}

            {mainView === 'EXPENSE' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 sm:p-3 overflow-hidden">
                <TabExpenses
                  expenses={expenses || []}
                  activeTab={activeExpenseTab}
                  onUpdateStatus={handleExpenseStatusUpdate}
                  onOpenAdd={() => setIsExpenseFormOpen(true)}
                  canApprove={canPerformAction(role, PERMISSIONS.APPROVE_EXPENSE)}
                />
              </div>
            )}

            {mainView === 'AGING_PIUTANG' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabAgingPiutang invoices={invoices || []} onViewDetail={handleOpenDetail} />
              </div>
            )}

            {mainView === 'PROFIT_CENTER' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabProfitCenter invoices={invoices || []} expenses={expenses || []} />
              </div>
            )}

            {mainView === 'CASH_FLOW' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabCashFlow
                  invoices={invoices || []}
                  expenses={expenses || []}
                  accounts={accounts || []}
                />
              </div>
            )}

            {mainView === 'CASH' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabCashBank
                  accounts={accounts || []}
                  onOpenAddAccount={() => setIsAccountFormOpen(true)}
                  onOpenTransfer={() => setIsTransferOpen(true)}
                  onOpenReconciliation={() => setIsReconOpen(true)}
                />
              </div>
            )}

            {mainView === 'REKAP_ALOKASI' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabLaporanAlokasi
                  invoices={invoices || []}
                  expenses={expenses || []}
                  accounts={accounts || []}
                />
              </div>
            )}

            {mainView === 'REPORT' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabReports
                  journals={journals || []}
                  accounts={accounts || []}
                  invoices={invoices || []}
                  expenses={expenses || []}
                />
              </div>
            )}

            {mainView === 'EXPORT' && !isRestrictedStaff && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <TabExport
                  invoices={invoices || []}
                  expenses={expenses || []}
                  journals={journals || []}
                  accounts={accounts || []}
                />
              </div>
            )}
          </>
        )}
      </div>

      {isFormOpen && (
        <div className="workspace-page-container">
          <ModalFormInvoice
            asPage={true}
            onClose={() => {
              setIsFormOpen(false);
              setEditingInvoice(null);
            }}
            onSubmit={handleFormSubmit}
            initialData={editingInvoice}
            invoices={invoices || []}
          />
        </div>
      )}

      {isDetailOpen && selectedInvoice && (
        <ModalInvoiceDetail
          invoice={selectedInvoice}
          accounts={accounts || []}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onAddPayment={handleOpenPayment}
          onVerifyPending={handleVerifyPendingProof}
          onRejectPending={handleRejectPendingProof}
          onCancelInvoice={handleCancelInvoice}
          onDuplicateInvoice={handleDuplicateInvoice}
          onOpenKwitansi={handleOpenKwitansiModal}
        />
      )}

      {isKwitansiModalOpen && selectedKwitansiInvoice && (
        <ModalPreviewKwitansi
          invoice={selectedKwitansiInvoice}
          onClose={() => setIsKwitansiModalOpen(false)}
          onPrint={handleProcessPrintKwitansi}
        />
      )}

      {isPaymentOpen && selectedInvoice && (
        <ModalFormPayment
          invoice={selectedInvoice}
          accounts={accounts || []}
          pendingHistoryItem={pendingVerificationItem}
          onClose={() => {
            setIsPaymentOpen(false);
            setPendingVerificationItem(null);
            setTimeout(() => setIsDetailOpen(true), 150);
          }}
          onSave={handlePaymentSubmit}
        />
      )}

      {isAllocateOpen && !isRestrictedStaff && allocatingInvoice && (
        <ModalAllocateInvoice
          invoice={allocatingInvoice}
          accounts={accounts || []}
          onClose={() => setIsAllocateOpen(false)}
          onAllocate={handleAllocateSubmit}
        />
      )}
      {isExpenseFormOpen && (
        <ModalFormExpense
          onClose={() => setIsExpenseFormOpen(false)}
          onSubmit={handleExpenseSubmit}
          accounts={accounts || []}
        />
      )}
      {isTransferOpen && !isRestrictedStaff && (
        <ModalFormTransfer
          onClose={() => setIsTransferOpen(false)}
          onSubmit={handleTransferSubmit}
          accounts={accounts || []}
        />
      )}
      {isAccountFormOpen && !isRestrictedStaff && (
        <ModalFormAccount
          onClose={() => setIsAccountFormOpen(false)}
          onSubmit={handleAccountSubmit}
        />
      )}
      {isReconOpen && !isRestrictedStaff && (
        <ModalBankReconciliation
          onClose={() => setIsReconOpen(false)}
          journals={journals || []}
        />
      )}
    </div>
  );
}
