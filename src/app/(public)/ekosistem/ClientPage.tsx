'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Cpu, MessageSquare } from 'lucide-react';
import { useTenants } from '@/hooks/useTenants';
import { useHubThreads } from '@/hooks/useHub';

import SectionContainer from '@/components/ui/SectionContainer';
import EkosistemHero, { EkosistemView } from './components/EkosistemHero';
import TenantFilters from './components/TenantFilters';
import TenantCard from './components/TenantCard';
import HubThreadFilters from './components/HubThreadFilters';
import HubThreadCard from './components/HubThreadCard';
import CreateThreadModal from './components/CreateThreadModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

export default function EkosistemSmartHubPage() {
  const [activeView, setActiveView] = useState<EkosistemView>('DIRECTORY');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // States for Directory View
  const { allTenants: tenants, loadingAll: tenantsLoading } = useTenants();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('Semua');

  // States for Hub View
  const [hubRoleFilter, setHubRoleFilter] = useState('All');
  const [hubTypeFilter, setHubTypeFilter] = useState('All');
  const { threads, loading: threadsLoading } = useHubThreads(
    hubRoleFilter !== 'All' ? hubRoleFilter : undefined,
    hubTypeFilter !== 'All' ? hubTypeFilter : undefined
  );

  const filteredTenants = tenants.filter((tenant) => {
    const tenantSegment = tenant.segment || 'StartUp';
    const matchSegment = activeSegment === 'Semua' || tenantSegment === activeSegment;
    const matchSearch =
      searchQuery === '' ||
      `${tenant.name} ${tenant.elevatorPitch || ''} ${tenant.sector}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchSegment && matchSearch;
  });

  return (
    <SectionContainer accent="indigo" width="wide" containerClassName="px-0 sm:px-0 lg:px-0 max-w-full">
      {/* 1. Modal Buat Thread */}
      <CreateThreadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* 2. Page Hero & View Toggle (Breadcrumb + Title + Tab Switcher) */}
      <EkosistemHero activeView={activeView} onViewChange={setActiveView} />

      {/* 3. Main Content View Area */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* VIEW 1: DIREKTORI PROFIL STARTUP & TENANT                */}
          {/* ======================================================== */}
          {activeView === 'DIRECTORY' && (
            <motion.div
              key="directory"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              {/* Unified Sticky Filter Bar */}
              <TenantFilters
                activeSegment={activeSegment}
                onSegmentChange={setActiveSegment}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalResults={filteredTenants.length}
              />

              {/* Tenants Grid */}
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">
                {tenantsLoading && (
                  <div className="public-grid-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <div
                        key={n}
                        className="public-card p-6 h-[320px] flex flex-col relative overflow-hidden"
                      >
                        <div className="public-shimmer absolute top-0 left-0 w-full h-24" />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="public-shimmer w-16 h-16 rounded-2xl" />
                          <div className="public-shimmer w-16 h-6 rounded-full" />
                        </div>
                        <div className="public-shimmer w-1/3 h-4 rounded mb-3" />
                        <div className="public-shimmer w-3/4 h-6 rounded mb-4" />
                        <div className="public-shimmer w-full h-3 rounded mb-2" />
                        <div className="public-shimmer w-4/5 h-3 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {!tenantsLoading && filteredTenants.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 sm:py-32 text-center bg-white rounded-3xl border border-slate-200/80 border-dashed px-6"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                      <Cpu className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak Ada Data Ditemukan</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Tidak ditemukan profil yang cocok dengan pencarian &quot;{searchQuery}&quot; pada segmen &quot;{activeSegment}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveSegment('Semua');
                      }}
                      className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-xs"
                    >
                      Reset Filter & Pencarian
                    </button>
                  </motion.div>
                )}

                {!tenantsLoading && filteredTenants.length > 0 && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="public-grid-4"
                  >
                    {filteredTenants.map((tenant) => (
                      <TenantCard key={tenant.id} tenant={tenant} />
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: BURSA KOLABORASI (HUB BOARD)                     */}
          {/* ======================================================== */}
          {activeView === 'HUB' && (
            <motion.div
              key="hub"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Sidebar Filters & Action Card */}
                <div className="lg:col-span-1">
                  <HubThreadFilters
                    activeRole={hubRoleFilter}
                    onRoleChange={setHubRoleFilter}
                    activeType={hubTypeFilter}
                    onTypeChange={setHubTypeFilter}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  />
                </div>

                {/* Main Feed Threads */}
                <div className="lg:col-span-3 space-y-5">
                  {/* Status Bar Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">Feed Diskusi & Kolaborasi</h2>
                    <span className="text-xs font-bold text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
                      {threadsLoading ? 'Memuat...' : `${threads.length} Thread Aktif`}
                    </span>
                  </div>

                  {threadsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xs h-44 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/80 border-dashed py-20 px-6 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">Belum Ada Thread</h3>
                      <p className="text-slate-500 text-xs sm:text-sm max-w-sm mb-5">
                        Jadilah yang pertama memulai kolaborasi atau sesuaikan filter Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-indigo-700 transition-colors"
                      >
                        Mulai Diskusi Baru
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {threads.map((thread) => (
                        <HubThreadCard key={thread.id} thread={thread} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </SectionContainer>
  );
}