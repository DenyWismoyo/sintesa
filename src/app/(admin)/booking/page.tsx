// Lokasi file: src/app/(admin)/booking/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAppId } from '@/lib/appId';
import { useBooking } from '@/hooks/useBooking'; 
import { useAdminTab } from '@/hooks/useAdminTab';
import { ListTodo, Calendar as CalendarIcon, DoorOpen, Loader2, Handshake, SlidersHorizontal } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

// Import Tab Components
import TabOverviewBooking from './components/TabOverviewBooking';
import TabKalenderMaster from './components/TabKalenderMaster';
import TabManajemenRuangan from './components/TabManajemenRuangan';
import TabKemitraanB2B from './components/TabKemitraanB2B';
import TabFasilitasTeknis from './components/TabFasilitasTeknis';

const BOOKING_TABS = ['Antrean', 'Kalender', 'Ruangan', 'Fasilitas Teknis', 'Kemitraan'] as const;
type BookingTab = (typeof BOOKING_TABS)[number];

export default function AdminBookingPage() {
  const { user } = useAuth();
  const appId = getAppId();

  const { bookings, loading } = useBooking('admin');
  
  const [activeTab, setActiveTab] = useAdminTab<BookingTab>('Antrean', BOOKING_TABS);

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
        tabs={[
          { id: 'Antrean', label: 'Antrean', icon: <ListTodo size={14} />, badge: pendingCount || undefined },
          { id: 'Kalender', label: 'Kalender Master', icon: <CalendarIcon size={14} /> },
          { id: 'Ruangan', label: 'Manajemen Ruangan', icon: <DoorOpen size={14} /> },
          { id: 'Fasilitas Teknis', label: 'Fasilitas Teknis & Add-ons', icon: <SlidersHorizontal size={14} /> },
          { id: 'Kemitraan', label: 'Kemitraan B2B & RFP', icon: <Handshake size={14} /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as BookingTab)}
      />

      {/* RENDER TAB AKTIF */}
      {activeTab === 'Antrean' && <TabOverviewBooking bookings={bookings} appId={appId} />}
      {activeTab === 'Kalender' && <TabKalenderMaster bookings={bookings} />}
      {activeTab === 'Ruangan' && <TabManajemenRuangan />}
      {activeTab === 'Fasilitas Teknis' && <TabFasilitasTeknis />}
      {activeTab === 'Kemitraan' && <TabKemitraanB2B />}

    </div>
  );
}