// Lokasi file: src/app/(admin)/booking/page.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAppId } from '@/lib/appId';
import { useBooking } from '@/hooks/useBooking'; 
import { ListTodo, Calendar as CalendarIcon, DoorOpen, Loader2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

// Import Tab Components
import TabOverviewBooking from './components/TabOverviewBooking';
import TabKalenderMaster from './components/TabKalenderMaster';
import TabManajemenRuangan from './components/TabManajemenRuangan';

export default function AdminBookingPage() {
  const { user } = useAuth();
  const appId = getAppId();

  const { bookings, loading } = useBooking('admin');
  
  const [activeTab, setActiveTab] = useState<'Antrean' | 'Kalender' | 'Ruangan'>('Antrean');

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Sistem Peminjaman & Fasilitas"
        subtitle="Kelola persetujuan sewa, pantau kalender okupansi, dan atur spesifikasi ruangan."
        badge={pendingCount > 0 ? `${pendingCount} Menunggu Persetujuan` : 'Antrean Bersih'}
        breadcrumbs={[{ label: 'Booking & Jadwal' }]}
      >
        {/* PILL TABS */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto w-full xl:w-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('Antrean')} 
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'Antrean' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <ListTodo size={16}/> Antrean 
            {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-xs">{pendingCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('Kalender')} 
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'Kalender' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <CalendarIcon size={16}/> Kalender Master
          </button>
          <button 
            onClick={() => setActiveTab('Ruangan')} 
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'Ruangan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <DoorOpen size={16}/> Manajemen Ruangan
          </button>
        </div>
      </AdminPageHeader>

      {/* RENDER TAB AKTIF */}
      {activeTab === 'Antrean' && <TabOverviewBooking bookings={bookings} appId={appId} />}
      {activeTab === 'Kalender' && <TabKalenderMaster bookings={bookings} />}
      {activeTab === 'Ruangan' && <TabManajemenRuangan />}

    </div>
  );
}