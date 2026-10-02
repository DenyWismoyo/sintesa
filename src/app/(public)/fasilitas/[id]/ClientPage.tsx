// Lokasi: src/app/(public)/fasilitas/[id]/ClientPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Asset } from '@/types/asset.types';
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Building2, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Wifi, 
  Tv, 
  Mic2, 
  Wind, 
  Maximize2, 
  Sparkles,
  Share2,
  CalendarCheck,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionContainer from '@/components/ui/SectionContainer';
import StatusBadge from '@/components/ui/StatusBadge';
import { AffiliateShareButton } from '@/components/common/AffiliateShareButton';
import { SocialShareBar } from '@/components/common/SocialShareBar';
import { StickyActionBar } from '@/components/common/StickyActionBar';
import BookingWizardModal from '../components/BookingWizardModal';
import { useBooking } from '@/hooks/useBooking';
import { getActiveRefCode } from '@/components/common/AffiliateTracker';
import { toast } from 'sonner';

interface RoomDetailClientProps {
  roomId: string;
  initialRoom: Asset | null;
}

export default function RoomDetailClient({ roomId, initialRoom }: RoomDetailClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState<Asset | null>(initialRoom);
  const [loading, setLoading] = useState(!initialRoom);
  const [activePhoto, setActivePhoto] = useState<string>(initialRoom?.imageUrl || '');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitBooking } = useBooking('public');

  useEffect(() => {
    if (!initialRoom) {
      const fetchRoom = async () => {
        try {
          const docRef = doc(db, 'assets', roomId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as Asset;
            setRoom(data);
            setActivePhoto(data.imageUrl || '');
          }
        } catch (err) {
          console.error('Gagal mengambil data fasilitas:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchRoom();
    }
  }, [roomId, initialRoom]);

  if (loading) {
    return (
      <SectionContainer accent="sky">
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Memuat profil ruangan & fasilitas...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!room) {
    return (
      <SectionContainer accent="sky">
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <Building2 size={48} className="text-slate-300 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-slate-900">Ruangan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Fasilitas yang Anda cari mungkin sedang dalam pemeliharaan atau tautan tidak valid.</p>
          <Link
            href="/fasilitas"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft size={14} /> Kembali ke Daftar Fasilitas
          </Link>
        </div>
      </SectionContainer>
    );
  }

  const harga = Number(room.priceValue) || 0;
  const isKomersial = room.isRentable === true || String(room.isRentable) === 'true';

  const galleryList = Array.from(new Set([
    room.imageUrl,
    ...(room.galleryUrls || [])
  ])).filter(Boolean) as string[];

  const handleSubmitBooking = async (formData: any) => {
    if (!room || !room.id) return;
    setIsSubmitting(true);
    const refCode = getActiveRefCode();
    const payload = {
      ...formData,
      assetId: room.id as string,
      assetName: room.name,
      referralCode: refCode || undefined
    };

    const res = await submitBooking(payload);
    setIsSubmitting(false);

    if (res.success) {
      setShowBookingModal(false);
      toast.success('Pengajuan peminjaman berhasil dikirim!', {
        description: 'Tim Solo Technopark akan segera memverifikasi ketersediaan jadwal Anda.'
      });
    } else {
      toast.error('Gagal mengirim peminjaman', {
        description: res.error || 'Terjadi kesalahan sistem'
      });
    }
  };

  return (
    <SectionContainer accent="sky" width="default">
      <div className="py-6 sm:py-10 space-y-10">

        {/* --- 1. BREADCRUMBS & BACK --- */}
        <div className="flex items-center justify-between">
          <Link
            href="/fasilitas"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} /> Kembali ke Semua Fasilitas
          </Link>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            {room.category}
          </Badge>
        </div>

        {/* --- 2. HERO GALLERY & SPECS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Galeri Foto */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-video -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full rounded-none sm:rounded-3xl overflow-hidden bg-slate-100 border-0 sm:border sm:border-slate-200 shadow-none sm:shadow-sm relative group">
              {activePhoto ? (
                <img src={activePhoto} alt={room.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Building2 size={48} className="mb-2 opacity-50" />
                  <span className="text-xs font-bold">Solo Technopark</span>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <StatusBadge 
                  status={room.status === 'Tersedia' ? 'TERSEDIA' : room.status.toUpperCase()} 
                  variant={room.status === 'Tersedia' ? 'success' : 'default'} 
                  size="sm" 
                />
              </div>
            </div>

            {/* Thumbnail Carousel - YouTube 16:9 ratio */}
            {galleryList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {galleryList.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhoto(url)}
                    className={`w-24 sm:w-28 aspect-video rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activePhoto === url ? 'border-sky-600 scale-105 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Social Share & Affiliate */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
              <SocialShareBar title={`Sewa ${room.name} di Solo Technopark`} description={room.description} />
              <AffiliateShareButton
                path={`/fasilitas/${room.id}`}
                title={room.name}
                description={room.description}
                variant="subtle"
                size="sm"
              />
            </div>
          </div>

          {/* Kolom Kanan: Detail Tarif & Info Booking */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">Gedung & Laboratorium</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {room.name}
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                  <MapPin size={13} className="text-sky-500 shrink-0" />
                  <span>{room.location}</span>
                </p>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
                <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider block">Tarif Retribusi Layanan</span>
                {isKomersial && harga > 0 ? (
                  <div className="mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      Rp {harga.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold ml-1">/{room.pricingType || 'Hari'}</span>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    Fasilitas Kedinasan & Internal Kawasan
                  </p>
                )}
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Kapasitas</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Users size={14} className="text-sky-600" />
                    {room.capacity ? `${room.capacity} Orang` : 'Fleksibel'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tata Letak</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Maximize2 size={14} className="text-indigo-600" />
                    {room.layout || 'Standard / U-Shape'}
                  </span>
                </div>
              </div>

              {/* Primary Booking CTA */}
              <Button
                onClick={() => setShowBookingModal(true)}
                disabled={room.status === 'Pemeliharaan'}
                className="w-full h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/25 flex items-center justify-center gap-2"
              >
                <CalendarIcon size={16} />
                <span>Ajukan Peminjaman Ruangan</span>
              </Button>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Faktur & Surat Izin Resmi PPK-BLUD</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Dukungan teknisi audio visual standby</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* --- 3. DETAIL SPESIFIKASI & FASILITAS PENDUKUNG --- */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Kelengkapan</span>
            <h3 className="text-xl font-black text-slate-900">Fasilitas Standar Kawasan</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Wind size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Pendingin Ruang</h4>
                <p className="text-[10px] text-slate-500">AC Central Sejuk</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Tv size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Tampilan Visual</h4>
                <p className="text-[10px] text-slate-500">Proyektor / LED TV</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Mic2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Tata Suara</h4>
                <p className="text-[10px] text-slate-500">Wireless Mic & Sound</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Wifi size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Koneksi Internet</h4>
                <p className="text-[10px] text-slate-500">High-Speed Wi-Fi</p>
              </div>
            </div>
          </div>

          {room.description && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Deskripsi Lengkap</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {room.description}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* --- STICKY ACTION BAR SAAT SCROLL --- */}
      <StickyActionBar threshold={350}>
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">{room.name}</h4>
            <p className="text-[10px] sm:text-[11px] font-semibold text-sky-700 truncate">
              {isKomersial && harga > 0 ? `Rp ${harga.toLocaleString('id-ID')} / ${room.pricingType || 'Hari'}` : 'Fasilitas Internal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AffiliateShareButton
            path={`/fasilitas/${room.id}`}
            title={room.name}
            description={room.description}
            size="sm"
            variant="subtle"
            iconOnly={true}
          />
          <Button
            onClick={() => setShowBookingModal(true)}
            className="h-10 px-5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm border-0 shrink-0 active:scale-95"
          >
            Pesan Ruangan
          </Button>
        </div>
      </StickyActionBar>

      {/* --- BOOKING WIZARD MODAL --- */}
      {showBookingModal && (
        <BookingWizardModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          asset={room}
          onSubmit={handleSubmitBooking}
          isSubmitting={isSubmitting}
        />
      )}

    </SectionContainer>
  );
}
