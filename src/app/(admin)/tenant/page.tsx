'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TabDirektoriTenant from './components/TabDirektoriTenant';
import ModalFormTenant from './components/ModalFormTenant';
import KanbanBoardTenant from './components/KanbanBoardTenant';
import BusinessMatchingBoard from './components/BusinessMatchingBoard';
import DrawerProfilTenant from './components/DrawerProfilTenant';
import TabTagihanTenant from './components/TabTagihanTenant';
import TabKurasiProduk from './components/TabKurasiProduk';
import ModalKurasiProduk from './components/ModalKurasiProduk';
import TabValidasiTenant from './components/TabValidasiTenant';
import ModalReviewTenant from './components/ModalReviewTenant';
import TabHelpdeskTenant from './components/TabHelpdeskTenant';

import ModalFormInvoice from '../billing/component/ModalFormInvoice';
import ModalInvoiceDetail from '../billing/component/ModalInvoiceDetail';

import { Building2, KanbanSquare, Network, Receipt, ShieldCheck, UserCheck, Plus, Headset } from 'lucide-react'; 
import { AdminPageHeader, AdminStatGrid, AdminConfirmDialog } from '@/components/admin'; 
import { toast } from 'sonner'; 

// Import Custom Hooks
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling'; 
import { useFinance } from '@/hooks/useFinance';
import { useAdminTab } from '@/hooks/useAdminTab';
import { Tenant, Invoice } from '@/types';

const TENANT_TABS = ['direktori', 'validasi', 'kanban', 'matching', 'kurasi', 'tagihan', 'helpdesk'] as const;
type TenantTab = (typeof TENANT_TABS)[number];

export default function TenantAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useAdminTab<TenantTab>('direktori', TENANT_TABS);

  const { 
    tenants, 
    allTenants, 
    loading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    addTenant, 
    updateTenant, 
    removeTenant 
  } = useTenants();

  const { createNewInvoice, invoices } = useBilling();
  const { accounts } = useFinance();

  // State Modal Umum
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // State Drawer Profil
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Tenant | null>(null);

  // State Modal Tagihan
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState<Partial<Invoice> | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // State Modal Kurasi UKM
  const [isCurationModalOpen, setIsCurationModalOpen] = useState(false);
  const [selectedCurationTenant, setSelectedCurationTenant] = useState<Tenant | null>(null);

  // STATE BARU FASE 5: Modal Validasi Pra-Inkubasi
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedValidationTenant, setSelectedValidationTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  // Handler Modal
  const handleOpenAdd = () => { router.push('/tenant/editor'); };
  const handleOpenEdit = (tenant: Tenant) => { router.push(`/tenant/editor?id=${tenant.id}`); };
  const handleCloseModal = () => { setIsModalOpen(false); setTimeout(() => setSelectedTenant(null), 200); };

  const handleViewProfile = (tenant: Tenant) => { router.push(`/tenant/${tenant.id}`); };
  const handleCloseDrawer = () => { setIsDrawerOpen(false); setTimeout(() => setSelectedProfile(null), 200); };

  const handleStartCuration = (tenant: Tenant) => { router.push(`/tenant/${tenant.id}?mode=kurasi`); };
  const handleCloseCuration = () => { setIsCurationModalOpen(false); setTimeout(() => setSelectedCurationTenant(null), 200); };

  // HANDLER BARU FASE 5: Validasi Pendaftar
  const handleStartValidation = (tenant: Tenant) => { setSelectedValidationTenant(tenant); setIsValidationModalOpen(true); };
  const handleCloseValidation = () => { setIsValidationModalOpen(false); setTimeout(() => setSelectedValidationTenant(null), 200); };

  const handleSaveValidationDecision = async (tenantId: string, decisionData: Partial<Tenant>) => {
    try {
      const res = await updateTenant(tenantId, decisionData);
      if (res && !res.success) toast.error("Gagal menyimpan keputusan: " + res.error);
      else toast.success("Keputusan berhasil disimpan! Status tenant telah diperbarui.");
    } catch (error) { console.error("Error saving decision:", error); }
  };

  const handleUpdateStage = async (tenantId: string, newStage: string) => {
    try {
      const res = await updateTenant(tenantId, { pipelineStage: newStage as any });
      if (res && !res.success) toast.error("Gagal memperbarui status: " + res.error);
    } catch (error) { console.error("Gagal update stage:", error); }
  };

  const handleSaveTenant = async (data: Partial<Tenant>, logoFile?: File | null, docFile?: File | null, pitchDeckFile?: File | null, coverImageFile?: File | null) => {
    try {
      let res = selectedTenant?.id 
        ? await updateTenant(selectedTenant.id, data, logoFile, docFile, pitchDeckFile, coverImageFile)
        : await addTenant(data as Omit<Tenant, 'id' | 'createdAt'>, logoFile, docFile);

      if (res && !res.success) toast.error("Gagal menyimpan data tenant: " + res.error);
      else handleCloseModal();
    } catch (error: any) { toast.error("Terjadi kesalahan sistem: " + error.message); }
  };

  const handleDeleteTenant = (id: string) => {
    setTenantToDelete(id);
  };

  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setIsDeletingTenant(true);
    try {
      const res = await removeTenant(tenantToDelete);
      if (res && !res.success) toast.error("Gagal menghapus tenant: " + res.error);
      else toast.success("Tenant berhasil dihapus dari basis data.");
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem: " + error.message);
    } finally {
      setIsDeletingTenant(false);
      setTenantToDelete(null);
    }
  };

  const handleBuatTagihanTenant = (tenant: Tenant) => {
    setInvoiceDraft({
      customerType: 'Tenant',
      tenantId: tenant.id,
      customerName: tenant.name,
      customerEmail: tenant.email || '',
      customerPhone: tenant.contact || '',
      division: 'INKUBASI_TENANT',
      term: 'FULL_PAYMENT',
      items: [
        {
          id: `TNT-${Date.now()}`,
          referenceId: tenant.id,
          referenceType: 'TENANT',
          description: `Tagihan Sewa Ruang / Inkubasi Tenant - ${tenant.name}`,
          unit: 'Bulan',
          quantity: 1,
          unitPrice: 0,
          total: 0
        }
      ]
    });
    setIsInvoiceModalOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDetailOpen(true);
  };

  const handleSubmitInvoice = async (data: Partial<Invoice>) => {
    const res = await createNewInvoice(data as Omit<Invoice, 'id'>);
    if (res.success) { alert("Tagihan berhasil diterbitkan!"); setIsInvoiceModalOpen(false); } 
    else { alert("Gagal membuat tagihan: " + res.error); }
  };

  const activeTenantsCount = allTenants.filter((t: Tenant) => t.status === 'Aktif').length;
  const alumniTenantsCount = allTenants.filter((t: Tenant) => t.status === 'Alumni' || t.pipelineStage === 'Alumni').length;
  const pendingTenantsCount = allTenants.filter((t: Tenant) => t.status === 'Menunggu Review').length;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Manajemen Tenant & Inkubasi"
        subtitle="Kelola direktori startup binaan, validasi pendaftar, progres inkubasi, kurasi produk UKM, dan helpdesk fasilitas."
        badge={`${allTenants.length} Tenant Terdaftar`}
        breadcrumbs={[{ label: 'Inkubasi Tenant' }]}
        tabs={[
          { id: 'direktori', label: 'Direktori', icon: <Building2 size={14} />, badge: allTenants.length },
          { id: 'validasi', label: 'Validasi Pendaftar', icon: <UserCheck size={14} />, badge: pendingTenantsCount || undefined },
          { id: 'kanban', label: 'Pipeline Kanban', icon: <KanbanSquare size={14} /> },
          { id: 'matching', label: 'Business Matching', icon: <Network size={14} /> },
          { id: 'kurasi', label: 'Kurasi UKM', icon: <ShieldCheck size={14} /> },
          { id: 'tagihan', label: 'Tagihan Tenant', icon: <Receipt size={14} /> },
          { id: 'helpdesk', label: 'Helpdesk Keluhan', icon: <Headset size={14} /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TenantTab)}
        actions={
          <button 
            onClick={handleOpenAdd} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={15} />
            <span>Tambah Tenant</span>
          </button>
        }
      />

      <AdminStatGrid
        columns={3}
        items={[
          {
            label: 'Menunggu Validasi',
            value: pendingTenantsCount,
            icon: <UserCheck size={18} />,
            color: 'amber',
            subtext: 'Pendaftar pra-inkubasi baru',
            onClick: () => setActiveTab('validasi'),
            active: activeTab === 'validasi',
          },
          {
            label: 'Startup Aktif (Inkubasi)',
            value: activeTenantsCount,
            icon: <KanbanSquare size={18} />,
            color: 'emerald',
            subtext: 'Tenant aktif dalam pembinaan',
            onClick: () => setActiveTab('direktori'),
            active: activeTab === 'direktori',
          },
          {
            label: 'Lulus Binaan (Alumni)',
            value: alumniTenantsCount,
            icon: <Network size={18} />,
            color: 'purple',
            subtext: 'Startup pasca-inkubasi',
            onClick: () => setActiveTab('kanban'),
            active: activeTab === 'kanban',
          },
        ]}
      />

      {/* Konten Tab Aktif */}
      <div className="min-h-[500px]">
        {activeTab === 'validasi' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <TabValidasiTenant tenants={allTenants} onReview={handleStartValidation} />
          </div>
        )}
        {activeTab === 'direktori' && <TabDirektoriTenant tenants={tenants} loading={loading} fetchNextPage={fetchNextPage} hasNextPage={!!hasNextPage} isFetchingNextPage={!!isFetchingNextPage} onEdit={handleOpenEdit} onDelete={handleDeleteTenant} onViewProfile={handleViewProfile} />}
        {activeTab === 'kanban' && <KanbanBoardTenant tenants={allTenants} onUpdateStage={handleUpdateStage} onViewProfile={handleViewProfile} />}
        {activeTab === 'matching' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
            <BusinessMatchingBoard tenants={allTenants} onViewProfile={handleViewProfile} />
          </div>
        )}
        {activeTab === 'kurasi' && <TabKurasiProduk tenants={allTenants} onStartCuration={handleStartCuration} />}
        {activeTab === 'tagihan' && <TabTagihanTenant tenants={allTenants} invoices={invoices} onBuatTagihan={handleBuatTagihanTenant} onViewInvoice={handleViewInvoice} />}
        {activeTab === 'helpdesk' && <TabHelpdeskTenant tenants={allTenants} />}
      </div>

      {/* Modals & Drawers */}
      <ModalFormTenant isOpen={isModalOpen} onClose={handleCloseModal} initialData={selectedTenant || undefined} onSubmit={handleSaveTenant} />
      <DrawerProfilTenant isOpen={isDrawerOpen} onClose={handleCloseDrawer} tenant={selectedProfile} invoices={invoices} />
      <ModalKurasiProduk isOpen={isCurationModalOpen} onClose={handleCloseCuration} tenant={selectedCurationTenant} />

      {/* MODAL BARU: VALIDASI KEPUTUSAN */}
      <ModalReviewTenant isOpen={isValidationModalOpen} onClose={handleCloseValidation} tenant={selectedValidationTenant} onSaveDecision={handleSaveValidationDecision} />

      {isInvoiceModalOpen && <ModalFormInvoice initialData={invoiceDraft as Invoice} invoices={invoices} onClose={() => setIsInvoiceModalOpen(false)} onSubmit={handleSubmitInvoice} />}
      <ModalInvoiceDetail isOpen={isInvoiceDetailOpen} onClose={() => setIsInvoiceDetailOpen(false)} invoice={selectedInvoice} accounts={accounts} />

      {/* Dialog Konfirmasi Hapus Tenant */}
      <AdminConfirmDialog
        isOpen={Boolean(tenantToDelete)}
        onClose={() => setTenantToDelete(null)}
        onConfirm={confirmDeleteTenant}
        isLoading={isDeletingTenant}
        title="Hapus Data Tenant"
        description="Apakah Anda yakin ingin menghapus tenant ini beserta seluruh arsip datanya secara permanen?"
        confirmText="Ya, Hapus Tenant"
        variant="danger"
      />
    </div>
  );
}
