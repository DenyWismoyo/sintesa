'use client';

import React, { useState } from 'react';
import TabDirektoriTenant from './components/TabDirektoriTenant';
import ModalFormTenant from './components/ModalFormTenant';
import KanbanBoardTenant from './components/KanbanBoardTenant';
import BusinessMatchingBoard from './components/BusinessMatchingBoard';
import StatCardTenant from './components/StatCardTenant';
import DrawerProfilTenant from './components/DrawerProfilTenant';
import TabTagihanTenant from './components/TabTagihanTenant';
import TabKurasiProduk from './components/TabKurasiProduk';
import ModalKurasiProduk from './components/ModalKurasiProduk';
import TabValidasiTenant from './components/TabValidasiTenant';
import ModalReviewTenant from './components/ModalReviewTenant';

import ModalFormInvoice from '../billing/component/ModalFormInvoice';
import ModalInvoiceDetail from '../billing/component/ModalInvoiceDetail';

import { Building2, KanbanSquare, Network, Receipt, ShieldCheck, UserCheck, Plus } from 'lucide-react'; 
import { AdminPageHeader } from '@/components/admin'; 

// Import Custom Hooks
import { useTenants } from '@/hooks/useTenants';
import { useBilling } from '@/hooks/useBilling'; 
import { useFinance } from '@/hooks/useFinance';
import { Tenant, Invoice } from '@/types';

export default function TenantAdminPage() {
  const [activeTab, setActiveTab] = useState('direktori');

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

  // Handler Modal
  const handleOpenAdd = () => { setSelectedTenant(null); setIsModalOpen(true); };
  const handleOpenEdit = (tenant: Tenant) => { setSelectedTenant(tenant); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setTimeout(() => setSelectedTenant(null), 200); };

  const handleViewProfile = (tenant: Tenant) => { setSelectedProfile(tenant); setIsDrawerOpen(true); };
  const handleCloseDrawer = () => { setIsDrawerOpen(false); setTimeout(() => setSelectedProfile(null), 200); };

  const handleStartCuration = (tenant: Tenant) => { setSelectedCurationTenant(tenant); setIsCurationModalOpen(true); };
  const handleCloseCuration = () => { setIsCurationModalOpen(false); setTimeout(() => setSelectedCurationTenant(null), 200); };

  // HANDLER BARU FASE 5: Validasi Pendaftar
  const handleStartValidation = (tenant: Tenant) => { setSelectedValidationTenant(tenant); setIsValidationModalOpen(true); };
  const handleCloseValidation = () => { setIsValidationModalOpen(false); setTimeout(() => setSelectedValidationTenant(null), 200); };

  const handleSaveValidationDecision = async (tenantId: string, decisionData: Partial<Tenant>) => {
    try {
      const res = await updateTenant(tenantId, decisionData);
      if (res && !res.success) alert("Gagal menyimpan keputusan: " + res.error);
      else alert("Keputusan berhasil disimpan! Status tenant telah diperbarui.");
    } catch (error) { console.error("Error saving decision:", error); }
  };

  const handleUpdateStage = async (tenantId: string, newStage: string) => {
    try {
      const res = await updateTenant(tenantId, { pipelineStage: newStage as any });
      if (res && !res.success) alert("Gagal memperbarui status: " + res.error);
    } catch (error) { console.error("Gagal update stage:", error); }
  };

  const handleSaveTenant = async (data: Partial<Tenant>, logoFile?: File | null, docFile?: File | null, pitchDeckFile?: File | null, coverImageFile?: File | null) => {
    try {
      let res = selectedTenant?.id 
        ? await updateTenant(selectedTenant.id, data, logoFile, docFile, pitchDeckFile, coverImageFile)
        : await addTenant(data as Omit<Tenant, 'id' | 'createdAt'>, logoFile, docFile);

      if (res && !res.success) alert("Gagal menyimpan data tenant: " + res.error);
      else handleCloseModal();
    } catch (error: any) { alert("Terjadi kesalahan sistem."); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (window.confirm("Yakin ingin menghapus tenant ini beserta seluruh datanya?")) {
      const res = await removeTenant(id);
      if (res && !res.success) alert("Gagal menghapus tenant: " + res.error);
    }
  };

  const handleBuatTagihanTenant = (tenant: Tenant) => {
    setInvoiceDraft({
      customerType: 'Tenant', customerName: tenant.name, customerEmail: tenant.email || '',
      customerPhone: tenant.contact || '', term: 'FULL_PAYMENT'
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
        subtitle="Kelola direktori startup binaan, validasi pendaftar, progres inkubasi, dan kurasi produk UKM."
        badge={`${allTenants.length} Tenant Terdaftar`}
        breadcrumbs={[{ label: 'Inkubasi Tenant' }]}
        actions={
          <button 
            onClick={handleOpenAdd} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={16} />
            <span>Tambah Tenant</span>
          </button>
        }
      >
        {/* NAVIGASI PILL TAB */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto w-full xl:w-auto hide-scrollbar">
          <button onClick={() => setActiveTab('validasi')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap relative ${activeTab === 'validasi' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <UserCheck size={16} /> Validasi 
            {pendingTenantsCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">{pendingTenantsCount}</span>
            )}
          </button>

          <button onClick={() => setActiveTab('direktori')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'direktori' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <Building2 size={16} /> Direktori
          </button>
          <button onClick={() => setActiveTab('kanban')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <KanbanSquare size={16} /> Kanban
          </button>
          <button onClick={() => setActiveTab('matching')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'matching' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <Network size={16} /> Matching
          </button>
          <button onClick={() => setActiveTab('kurasi')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'kurasi' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <ShieldCheck size={16} /> Kurasi UKM
          </button>
          <button onClick={() => setActiveTab('tagihan')} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'tagihan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <Receipt size={16} /> Tagihan
          </button>
        </div>
      </AdminPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCardTenant title="Menunggu Validasi" value={pendingTenantsCount} icon={<UserCheck size={24} />} colorClass="bg-amber-50 text-amber-600" />
        <StatCardTenant title="Startup Aktif (Inkubasi)" value={activeTenantsCount} icon={<KanbanSquare size={24} />} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCardTenant title="Lulus Binaan (Alumni)" value={alumniTenantsCount} icon={<Network size={24} />} colorClass="bg-purple-50 text-purple-600" />
      </div>

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
      </div>

      {/* Modals & Drawers */}
      <ModalFormTenant isOpen={isModalOpen} onClose={handleCloseModal} initialData={selectedTenant || undefined} onSubmit={handleSaveTenant} />
      <DrawerProfilTenant isOpen={isDrawerOpen} onClose={handleCloseDrawer} tenant={selectedProfile} invoices={invoices} />
      <ModalKurasiProduk isOpen={isCurationModalOpen} onClose={handleCloseCuration} tenant={selectedCurationTenant} />

      {/* MODAL BARU: VALIDASI KEPUTUSAN */}
      <ModalReviewTenant isOpen={isValidationModalOpen} onClose={handleCloseValidation} tenant={selectedValidationTenant} onSaveDecision={handleSaveValidationDecision} />

      {isInvoiceModalOpen && <ModalFormInvoice initialData={invoiceDraft as Invoice} invoices={invoices} onClose={() => setIsInvoiceModalOpen(false)} onSubmit={handleSubmitInvoice} />}
      <ModalInvoiceDetail isOpen={isInvoiceDetailOpen} onClose={() => setIsInvoiceDetailOpen(false)} invoice={selectedInvoice} accounts={accounts} />
    </div>
  );
}