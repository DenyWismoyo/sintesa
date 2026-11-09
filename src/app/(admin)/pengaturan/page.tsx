'use client';

import React, { useEffect, useMemo } from 'react';
import { Building2, Wallet, Bell, Shield, Sliders, AlertTriangle } from 'lucide-react';
import TabProfilInstansi from './components/TabProfilInstansi';
import TabFinanceSettings from './components/TabFinanceSettings';
import TabKeamanan from './components/TabKeamanan';
import TabNotifikasiEmail from './components/TabNotifikasiEmail';
import TabKonfigurasiSistem from './components/TabKonfigurasiSistem';
import { useAuth } from '@/lib/AuthContext';
import { useAdminTab } from '@/hooks/useAdminTab';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { AdminPageHeader } from '@/components/admin';

const PENGATURAN_TABS = ['Profil', 'Keuangan', 'Sistem', 'Notifikasi', 'Keamanan'] as const;
type PengaturanTab = (typeof PENGATURAN_TABS)[number];

export default function PengaturanPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useAdminTab<PengaturanTab>('Profil', PENGATURAN_TABS);

  // Tentukan seluruh tab beserta syarat Permission-nya
  const allTabs = useMemo(() => [
    { id: 'Profil' as const, label: 'Profil Instansi', icon: Building2, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Keuangan' as const, label: 'Billing & Keuangan', icon: Wallet, permission: PERMISSIONS.MANAGE_FINANCE_BAS },
    { id: 'Sistem' as const, label: 'Konfigurasi Sistem', icon: Sliders, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Notifikasi' as const, label: 'Notifikasi', icon: Bell, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Keamanan' as const, label: 'Keamanan (RBAC)', icon: Shield, permission: PERMISSIONS.MANAGE_ROLES_USERS },
  ], []);

  // Filter tab yang HANYA boleh dilihat oleh role yang sedang login
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => canPerformAction(role, tab.permission));
  }, [allTabs, role]);

  // Set default active tab secara otomatis ke tab pertama yang diizinkan jika tab aktif tidak diizinkan
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab, setActiveTab]);

  // Jika user sama sekali tidak punya akses ke menu pengaturan apapun
  if (visibleTabs.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-2">Akses Terbatas</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Anda tidak memiliki hak akses (Permissions) untuk melihat atau mengubah modul pengaturan sistem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header Halaman Pengaturan Terstandarisasi */}
      <AdminPageHeader
        title="Pengaturan Sistem"
        description="Kelola profil instansi, preferensi keuangan BAS, dan perizinan hak akses (RBAC)."
        badge={`${visibleTabs.length} Modul Aktif`}
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Pengaturan' }
        ]}
        tabs={visibleTabs.map(t => ({
          id: t.id,
          label: t.label,
          icon: <t.icon size={14} />,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as PengaturanTab)}
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Konten Area Tab */}
        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'Profil' && <TabProfilInstansi />}
          {activeTab === 'Keuangan' && <TabFinanceSettings />}
          {activeTab === 'Keamanan' && <TabKeamanan />}
          {activeTab === 'Sistem' && <TabKonfigurasiSistem />}
          {activeTab === 'Notifikasi' && <TabNotifikasiEmail />}
        </div>
      </div>
    </div>
  );
}
