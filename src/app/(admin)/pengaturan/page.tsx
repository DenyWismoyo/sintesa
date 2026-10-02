'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Wallet, Bell, Shield, Sliders, AlertTriangle } from 'lucide-react';
import TabProfilInstansi from './components/TabProfilInstansi';
import TabFinanceSettings from './components/TabFinanceSettings';
import TabKeamanan from './components/TabKeamanan';
import { useAuth } from '@/lib/AuthContext';
import { canPerformAction, PERMISSIONS } from '@/config/roles';
import { AdminPageHeader } from '@/components/admin';

export default function PengaturanPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('');

  // Tentukan seluruh tab beserta syarat Permission-nya
  const allTabs = useMemo(() => [
    { id: 'Profil', label: 'Profil Instansi', icon: Building2, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Keuangan', label: 'Billing & Keuangan', icon: Wallet, permission: PERMISSIONS.MANAGE_FINANCE_BAS },
    { id: 'Sistem', label: 'Konfigurasi Sistem', icon: Sliders, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Notifikasi', label: 'Notifikasi', icon: Bell, permission: PERMISSIONS.EDIT_INSTITUTION_PROFILE },
    { id: 'Keamanan', label: 'Keamanan (RBAC)', icon: Shield, permission: PERMISSIONS.MANAGE_ROLES_USERS },
  ], []);

  // Filter tab yang HANYA boleh dilihat oleh role yang sedang login
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => canPerformAction(role, tab.permission));
  }, [allTabs, role]);

  // Set default active tab secara otomatis ke tab pertama yang diizinkan
  useEffect(() => {
    if (visibleTabs.length > 0 && (!activeTab || !visibleTabs.find(t => t.id === activeTab))) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

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
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Navigasi Tab (Dinamis berdasarkan Permission) */}
        <div className="flex border-b border-slate-100 overflow-x-auto hide-scrollbar bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-blue-50/40'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} /> 
              {tab.label}
            </button>
          ))}
        </div>

        {/* Konten Area Tab */}
        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'Profil' && <TabProfilInstansi />}
          {activeTab === 'Keuangan' && <TabFinanceSettings />}
          {activeTab === 'Keamanan' && <TabKeamanan />}
          
          {/* Placeholder untuk menu lain jika belum dikembangkan */}
          {activeTab === 'Sistem' && (
             <div className="text-center py-24 text-slate-500 animate-in fade-in">
               <Sliders className="h-16 w-16 mx-auto text-slate-300 mb-4 bg-slate-50 rounded-full p-4 border border-slate-100" />
               <p className="font-bold text-lg text-slate-700">Konfigurasi Sistem</p>
               <p className="text-sm mt-1">Modul ini dalam tahap pengembangan.</p>
             </div>
          )}
          {activeTab === 'Notifikasi' && (
             <div className="text-center py-24 text-slate-500 animate-in fade-in">
               <Bell className="h-16 w-16 mx-auto text-slate-300 mb-4 bg-slate-50 rounded-full p-4 border border-slate-100" />
               <p className="font-bold text-lg text-slate-700">Pengaturan Notifikasi Email & WA</p>
               <p className="text-sm mt-1">Modul ini dalam tahap pengembangan.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}