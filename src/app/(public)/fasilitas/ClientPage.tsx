// Lokasi file: src/app/(public)/fasilitas/ClientPage.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { bookingService } from '@/services/booking.service';
import { useAssets } from '@/hooks/useAssets';
import { useBooking } from '@/hooks/useBooking';
import { Asset, Booking } from '@/types';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Building2, DoorOpen, Calendar as CalendarIcon, ListFilter } from 'lucide-react';

import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import BorderlessSelect from '@/components/ui/BorderlessSelect';
import RoomCard from './components/RoomCard';
import RoomDetailModal from './components/RoomDetailModal';
import BookingWizardModal from './components/BookingWizardModal';
import FacilityCalendar from './components/FacilityCalendar';
import { getActiveRefCode } from '@/components/common/AffiliateTracker';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export default function FasilitasPublicPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priceValue:desc');

  // Menggunakan Master Cache Aset (1-Read Pattern dari cache_assets/master)
  const { publicRooms: rawRooms, loadingRooms: loadingAssets } = useAssets();

  // 1. FILTER & SEARCH: Di memori browser (Instan & 0 Firestore read)
  const rooms = useMemo(() => {
    let list = rawRooms;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => 
        (r.name || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.facilities || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    return list.slice().sort((a, b) => {
      const priceA = Number(a.priceValue) || 0;
      const priceB = Number(b.priceValue) || 0;
      if (sortBy === 'priceValue:desc') return priceB - priceA;
      return priceA - priceB;
    });
  }, [rawRooms, searchTerm, sortBy]);

  const { submitBooking } = useBooking('public');
  
  const [activeTab, setActiveTab] = useState<'daftar' | 'kalender'>('daftar');
  const [approvedBookings, setApprovedBookings] = useState<Booking[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'kalender') {
      const fetchPublicCalendar = async () => {
        setLoadingCalendar(true);
        try {
          const bookings = await bookingService.getPublicApprovedBookings();
          setApprovedBookings(bookings);
        } catch (error) {
          console.error("Gagal memuat jadwal:", error);
        } finally {
          setLoadingCalendar(false);
        }
      };
      fetchPublicCalendar();
    }
  }, [activeTab]);

  const handleSubmitBooking = async (formData: any) => {
    if (!selectedAsset || !selectedAsset.id) return;
    setIsSubmitting(true);
    const refCode = getActiveRefCode();
    const payload = { 
      ...formData, 
      assetId: selectedAsset.id as string, 
      assetName: selectedAsset.name,
      referralCode: refCode || undefined
    };
    const res = await submitBooking(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Pengajuan Terkirim!", { description: "Admin akan memverifikasi jadwal Anda segera." });
      setShowBookingWizard(false);
    } else {
      toast.error("Gagal Mengajukan", { description: res.error || "Jadwal mungkin bertabrakan." });
    }
  };

  return (
    <SectionContainer accent="sky">
      {/* Header Reusable PageHero */}
      <PageHero 
        breadcrumbs={[{ label: 'Fasilitas', href: '/fasilitas' }]}
        badge={{ label: 'Kawasan Inovasi & Layanan', icon: <Building2 size={13} />, variant: 'sky' }}
        title="Sewa Ruangan & Fasilitas Modern"
        subtitle="Temukan dan pesan ruang meeting, auditorium, atau fasilitas kelas dunia untuk menunjang aktivitas dan event Anda."
        accentColor="sky"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama ruangan, gedung, atau fasilitas..."
        isLoadingSearch={loadingAssets}
      />

      {/* Pill Tabs + Sortir Dropdown */}
      {/* Pill Tabs + Sortir Dropdown Minimalis */}
      <div className="flex flex-row items-center justify-between gap-2.5 mb-3 sm:mb-6 relative z-10 overflow-x-auto no-scrollbar py-0.5">
        <PillTabs
          tabs={[
            { key: 'daftar', label: 'Katalog Ruangan', icon: <DoorOpen size={14} /> },
            { key: 'kalender', label: 'Cek Kalender Master', icon: <CalendarIcon size={14} /> },
          ]}
          active={activeTab}
          onChange={(val) => setActiveTab(val as 'daftar' | 'kalender')}
          layoutId="fasilitas-pill-tab"
        />

        {activeTab === 'daftar' && (
          <BorderlessSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'priceValue:desc', label: 'Harga Tertinggi' },
              { value: 'priceValue:asc', label: 'Harga Terendah' },
            ]}
            prefixIcon={<ListFilter size={13} />}
          />
        )}
      </div>

      {/* Area Hasil */}
      <div className="relative z-10 min-h-[50vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'daftar' && (
            <motion.div key="daftar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {loadingAssets ? (
                <div className="public-grid-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="public-card p-5 flex flex-col">
                       <div className="public-shimmer h-48 w-full rounded-2xl mb-5" />
                       <div className="public-shimmer h-6 w-3/4 rounded-lg mb-3" />
                       <div className="public-shimmer h-4 w-1/2 rounded-lg mb-6" />
                       <div className="mt-auto pt-4 flex justify-between items-center">
                          <div className="public-shimmer h-6 w-1/3 rounded-lg" />
                          <div className="public-shimmer h-10 w-10 rounded-full" />
                       </div>
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <EmptyState 
                  icon={Building2}
                  title="Ruangan Tidak Ditemukan"
                  description="Kami tidak dapat menemukan fasilitas yang cocok dengan pencarian Anda. Silakan coba kata kunci lain."
                  actionLabel="Reset Pencarian"
                  onAction={() => setSearchTerm('')}
                />
              ) : (
                <motion.div className="public-grid-3" variants={staggerContainer} initial="hidden" animate="visible">
                  {rooms.map((room: Asset) => (
                    <RoomCard 
                      key={room.id} 
                      room={room} 
                      onShowDetail={(r) => router.push(`/fasilitas/${r.id}`)} 
                      onBook={(r) => { setSelectedAsset(r); setShowBookingWizard(true); }} 
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'kalender' && (
            <motion.div key="kalender" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <FacilityCalendar bookings={approvedBookings} loading={loadingCalendar} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RoomDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} room={selectedAsset} onBook={(r) => { setShowDetailModal(false); setTimeout(() => { setSelectedAsset(r); setShowBookingWizard(true); }, 200); }} />
      <BookingWizardModal isOpen={showBookingWizard} onClose={() => setShowBookingWizard(false)} asset={selectedAsset} onSubmit={handleSubmitBooking} isSubmitting={isSubmitting} />
    </SectionContainer>
  );
}