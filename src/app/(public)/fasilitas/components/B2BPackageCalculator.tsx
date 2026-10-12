// src/app/(public)/fasilitas/components/B2BPackageCalculator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Asset } from '@/types';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Download,
  Send,
  FileText,
  ShieldCheck,
  Tag,
  Monitor,
  Wifi,
  Video,
  Radio,
  Layers,
  HelpCircle,
  ChevronRight,
  Printer,
  X,
  Phone,
  Mail,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';
import { buildB2BQuotationPdf, loadLogoAsDataUrl } from '@/lib/pdf/b2bQuotationPdf';

interface B2BPackageCalculatorProps {
  rooms: Asset[];
  onSubmitBooking: (formData: any) => Promise<void>;
  isSubmitting?: boolean;
}

// Katalog Add-Ons Teknis & Operasional Standar Kawasan
const STANDARD_ADDONS = [
  { id: 'addon-videotron', name: 'Videotron LED P2.5 Indoor Stage', price: 3500000, unit: 'hari', icon: Monitor, description: 'Layar LED utama resolusi tinggi untuk panggung utama' },
  { id: 'addon-audio', name: 'Sound System Pro Line Array & 4 Mic Wireless', price: 2000000, unit: 'hari', icon: Radio, description: 'Sistem tata suara jernih berstandar konser auditorium' },
  { id: 'addon-streaming', name: 'Live Streaming Multi-Camera Kit + Operator', price: 2500000, unit: 'hari', icon: Video, description: '3 kamera broadcast, audio mixer, dan siaran YouTube/Zoom' },
  { id: 'addon-internet', name: 'Dedicated High-Speed Fiber Internet (100 Mbps)', price: 1200000, unit: 'hari', icon: Wifi, description: 'Jalur internet dedicated khusus panitia & peserta' },
  { id: 'addon-technician', name: 'Pendampingan Standby Tim Teknisi Lab & IT STP', price: 600000, unit: 'hari', icon: ShieldCheck, description: 'Tim teknis profesional mengawal kelancaran teknis acara' },
];

const EVENT_TYPES = [
  'Konferensi & Seminar Nasional',
  'Pelatihan ASN & Bimtek Kedinasan',
  'Pameran Teknologi & Produk Inovasi',
  'Hackathon & Kompetisi Digital',
  'Rapat Kerja & Munas Asosiasi',
  'Uji Coba Lab & Manufaktur Industri',
  'Gala Dinner & Wisuda Kelulusan',
];

export default function B2BPackageCalculator({
  rooms,
  onSubmitBooking,
  isSubmitting = false,
}: B2BPackageCalculatorProps) {
  // Karakteristik Acara
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [estimatedAttendance, setEstimatedAttendance] = useState('100 - 300 Peserta');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState(1);

  // Ruangan & Addons yang dipilih
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([
    'addon-videotron',
    'addon-audio',
  ]);

  // Modal Form Permohonan Resmi B2B
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Form PIC Kontak Instansi
  const [agencyName, setAgencyName] = useState('');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [eventPurpose, setEventPurpose] = useState('');
  const [isSurveyRequested, setIsSurveyRequested] = useState(true);
  const [preferredSurveyDate, setPreferredSurveyDate] = useState('');

  // Sinkronisasi Durasi Hari jika tanggal diubah
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
        const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        setDurationDays(diff);
      }
    }
  };

  // Toggle Ruangan
  const toggleRoom = (id: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  // Toggle Addon
  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((aId) => aId !== id) : [...prev, id]
    );
  };

  // Perhitungan Subtotal Ruangan
  const selectedRoomsList = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.includes(r.id || ''));
  }, [rooms, selectedRoomIds]);

  const roomsDailyTotal = useMemo(() => {
    return selectedRoomsList.reduce((acc, r) => acc + (Number(r.priceValue) || 0), 0);
  }, [selectedRoomsList]);

  // Perhitungan Subtotal Add-ons
  const selectedAddonsList = useMemo(() => {
    return STANDARD_ADDONS.filter((a) => selectedAddonIds.includes(a.id));
  }, [selectedAddonIds]);

  const addonsDailyTotal = useMemo(() => {
    return selectedAddonsList.reduce((acc, a) => acc + a.price, 0);
  }, [selectedAddonsList]);

  // Perhitungan Diskon Bundling Instansi (Diskon 10% jika >= 2 ruangan dan >= 2 hari)
  const isBundleDiscountEligible = selectedRoomIds.length >= 2 || durationDays >= 2;
  const rawTotal = (roomsDailyTotal + addonsDailyTotal) * Math.max(1, durationDays);
  const discountAmount = isBundleDiscountEligible ? Math.round(rawTotal * 0.1) : 0;
  const finalEstimatedBudget = Math.max(0, rawTotal - discountAmount);

  // Status ekspor PDF
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Handler Download PDF Murni
  const handleDownloadPdf = async () => {
    if (selectedRoomsList.length === 0) {
      toast.error('Pilih minimal 1 ruangan untuk membuat estimasi penawaran resmi.');
      return;
    }

    setIsExportingPdf(true);
    const toastId = toast.loading('Menyusun Dokumen PDF Resmi (Vektor A4)...');

    try {
      const logoBase64 = await loadLogoAsDataUrl('/logo-stp.png');
      const docNumber = `STP/B2B-EST/${Date.now().toString().slice(-6)}`;

      const doc = buildB2BQuotationPdf({
        quotationNumber: docNumber,
        agencyName: agencyName.trim() || 'Instansi / Korporat Mitra',
        picName: picName.trim() || 'Perwakilan Mitra',
        picPosition: picPosition.trim() || 'Penanggung Jawab Acara',
        picPhone: picPhone.trim() || '-',
        picEmail: picEmail.trim() || '-',
        eventType,
        startDate: startDate || undefined,
        endDate: endDate || startDate || undefined,
        durationDays: Math.max(1, durationDays),
        estimatedAttendance: parseInt(estimatedAttendance.replace(/\D/g, '')) || 0,
        rooms: selectedRoomsList.map((r) => ({
          id: r.id || '',
          name: r.name,
          capacity: r.capacity,
          location: r.location,
          pricePerDay: Number(r.priceValue) || 0,
        })),
        addons: selectedAddonsList.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          price: a.price,
          unit: a.unit,
        })),
        discountAmount,
        totalBudget: finalEstimatedBudget,
        isSurveyRequested,
        preferredSurveyDate: preferredSurveyDate || undefined,
        logoBase64: logoBase64 || undefined,
      });

      const safeAgency = (agencyName.trim() || 'Mitra').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Draf_Penawaran_STP_${safeAgency}_${docNumber.replace(/\//g, '_')}.pdf`;
      doc.save(filename);

      toast.success('Draf Penawaran Resmi berhasil diunduh dalam format PDF murni!', { id: toastId });
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      toast.error('Terjadi kesalahan saat menyusun dokumen PDF.', { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Submit Form Pengajuan Paket B2B
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoomsList.length === 0) {
      toast.error('Pilih minimal 1 ruangan utama untuk paket acara Anda.');
      return;
    }
    if (!agencyName.trim() || !picName.trim() || !picPhone.trim() || !startDate) {
      toast.error('Mohon lengkapi nama instansi, PIC, nomor WhatsApp, dan tanggal mulai acara.');
      return;
    }

    const primaryAsset = selectedRoomsList[0];
    const payload = {
      assetId: primaryAsset.id,
      assetName: `${primaryAsset.name} (+ ${selectedRoomsList.length - 1} Ruang Pendukung Paket B2B)`,
      userName: picName,
      userEmail: picEmail || `${picPhone.replace(/\D/g, '')}@b2b.client.com`,
      userPhone: picPhone,
      agency: agencyName,
      startDate: startDate,
      endDate: endDate || startDate,
      startTime: '08:00',
      endTime: '17:00',
      purpose: `[B2B PACKAGE EVENT: ${eventType}] ${eventPurpose || 'Penyelenggaraan acara institusi di Solo Technopark'}`,
      // Field B2B
      bookingType: 'B2B_PACKAGE',
      packageRooms: selectedRoomsList.map((r) => ({
        id: r.id || '',
        name: r.name,
        priceValue: Number(r.priceValue) || 0,
        pricingType: r.pricingType || 'Hari',
      })),
      packageAddons: selectedAddonsList.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        unit: a.unit,
      })),
      estimatedBudget: finalEstimatedBudget,
      estimatedAttendance: parseInt(estimatedAttendance.replace(/\D/g, '')) || 100,
      eventType: eventType,
      isSurveyRequested: isSurveyRequested,
      preferredSurveyDate: preferredSurveyDate || undefined,
      picPosition: picPosition,
    };

    try {
      await onSubmitBooking(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      // Error dihandle oleh toast di parent
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner Simulasi B2B ─── */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Corporate & Government Partnership Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
            Kalkulator Paket Acara & Fasilitas Multi-Ruangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Rancang paket sewa gabungan (*bundling*) untuk konferensi, diklat ASN, pameran inovasi, atau uji coba lab industri. Dapatkan estimasi anggaran transparan dan draf penawaran resmi ber-kop BLUD Solo Technopark untuk keperluan rapat instansi Anda.
          </p>
        </div>
      </div>

      {/* ─── Grid 2 Kolom: Konfigurator (Kiri) vs Ringkasan & Aksi (Kanan) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (7 SPAN): Pilihan Karakteristik & Fasilitas */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Karakteristik Acara */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-extrabold">
                1
              </span>
              <span>Karakteristik & Jadwal Acara</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Jenis Agenda Acara
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full h-9.5 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Perkiraan Jumlah Peserta
                </label>
                <select
                  value={estimatedAttendance}
                  onChange={(e) => setEstimatedAttendance(e.target.value)}
                  className="w-full h-9.5 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="20 - 50 Peserta">20 - 50 Delegasi (Workshop / Sidang)</option>
                  <option value="50 - 150 Peserta">50 - 150 Peserta (Diklat / Seminar)</option>
                  <option value="150 - 500 Peserta">150 - 500 Peserta (Konferensi / Munas)</option>
                  <option value="500 - 1500+ Peserta">500 - 1.500+ Peserta (Expo / Wisuda)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value, endDate || e.target.value)}
                  className="w-full h-9.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleDateChange(startDate, e.target.value)}
                  className="w-full h-9.5 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Durasi Acara
                </label>
                <div className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-900 flex items-center justify-between">
                  <span>{durationDays} Hari Operasional</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Pilihan Kombinasi Ruangan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-extrabold">
                  2
                </span>
                <span>Pilih Kombinasi Ruangan (Multi-Fasilitas)</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {selectedRoomIds.length} Ruang Dipilih
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Centang ruangan yang ingin Anda gabungkan dalam paket kegiatan:
            </p>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {rooms.map((room) => {
                const isSelected = selectedRoomIds.includes(room.id || '');
                const price = Number(room.priceValue) || 0;
                return (
                  <div
                    key={room.id}
                    onClick={() => toggleRoom(room.id || '')}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {room.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Kapasitas: {room.capacity || 'Sesuai Penataan'} org</span>
                          <span>•</span>
                          <span>{room.location || 'Kawasan STP'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-indigo-900">
                        {price > 0 ? formatRupiah(price) : 'Tarif Khusus'}
                      </div>
                      <div className="text-[10px] text-slate-400">/{room.pricingType || 'Hari'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Fasilitas Teknis & Add-ons Tambahan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-extrabold">
                  3
                </span>
                <span>Fasilitas Teknis & Perlengkapan Operasional</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {selectedAddonIds.length} Add-ons
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {STANDARD_ADDONS.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                const IconComp = addon.icon;
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-2xs'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {addon.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {addon.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-900">
                        {formatRupiah(addon.price)}
                      </div>
                      <div className="text-[10px] text-slate-400">/{addon.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (5 SPAN): Ringkasan Paket, Kalkulasi & Aksi B2B */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border-2 border-indigo-200/80 p-5 sm:p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
                  Ringkasan Estimasi Paket
                </span>
                <h4 className="text-base font-extrabold text-slate-900">
                  {eventType}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                {durationDays} Hari Acara
              </span>
            </div>

            {/* Item Breakdown List */}
            <div className="space-y-3 text-xs">
              {/* Ruangan */}
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Ruangan Terpilih ({selectedRoomsList.length})
                </span>
                {selectedRoomsList.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Belum ada ruangan dipilih.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedRoomsList.map((r) => (
                      <div key={r.id} className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">• {r.name}</span>
                        <span className="font-semibold shrink-0">
                          {formatRupiah(Number(r.priceValue) || 0)} /hari
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Addons */}
              {selectedAddonsList.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                    Add-ons Teknis ({selectedAddonsList.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedAddonsList.map((a) => (
                      <div key={a.id} className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">• {a.name}</span>
                        <span className="font-semibold shrink-0">
                          {formatRupiah(a.price)} /hari
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diskon Paket */}
              {discountAmount > 0 && (
                <div className="pt-2 border-t border-slate-100 flex justify-between text-emerald-700 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Insentif Bundling B2B (10%)
                  </span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Total Budget Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/40 border border-indigo-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Estimasi Total Anggaran Acara
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">
                {formatRupiah(finalEstimatedBudget)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                *Tarif resmi berdasar Perwali/SK BLUD Kota Surakarta. Dapat diterbitkan SPK & Faktur Pajak resmi.
              </p>
            </div>

            {/* 2 Tombol Aksi Utama */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={selectedRoomsList.length === 0}
                className="w-full h-12 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ajukan Penawaran & Jadwal Survey</span>
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  disabled={selectedRoomsList.length === 0}
                  className="h-10 rounded-xl text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pratinjau Draf</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={selectedRoomsList.length === 0 || isExportingPdf}
                  className="h-10 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Unduh PDF Murni</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Jaminan Layanan BLUD */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kuitansi, Kwitansi SPJ, & Faktur Resmi PPK-BLUD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Didampingi PIC Account Manager Khusus Instansi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: Form Permohonan Resmi B2B (Masuk ke Admin Booking) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Pengajuan Paket Acara Resmi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solo Technopark B2B Partnership Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Instansi / Perusahaan / Lembaga *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dinas Kominfo Jateng / PT Telkom Indonesia"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama PIC Kontak *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap PIC"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Ketua Panitia / PPK / Manajer"
                    value={picPosition}
                    onChange={(e) => setPicPosition(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="nama@instansi.go.id"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Agenda & Kebutuhan Khusus
                </label>
                <textarea
                  rows={2}
                  placeholder="Sebutkan detail susunan acara, kebutuhan konsumsi, atau tata letak panggung yang diharapkan..."
                  value={eventPurpose}
                  onChange={(e) => setEventPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Permohonan Survey Lokasi / Site Visit */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSurveyRequested}
                    onChange={(e) => setIsSurveyRequested(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Permohonan Jadwal Survey Lokasi Fisik (*Site Visit*)</span>
                </label>
                {isSurveyRequested && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Perkiraan Tanggal Kunjungan Survey yang Diinginkan:
                    </label>
                    <input
                      type="date"
                      value={preferredSurveyDate}
                      onChange={(e) => setPreferredSurveyDate(e.target.value)}
                      className="w-full h-8.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl h-10 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Pengajuan Resmi</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Pratinjau Draf Penawaran Resmi Siap Cetak (Printable Quotation) ─── */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-500">
                Pratinjau Draf Penawaran Resmi BLUD
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="rounded-xl h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 cursor-pointer shadow-sm"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyusun Dokumen PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen PDF Resmi (A4)</span>
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lembar Draf Surat Penawaran Resmi (Desain Dokumen A4 Elegan) */}
            <div className="p-7 sm:p-9 rounded-2xl border border-slate-300 bg-white font-sans text-xs space-y-6 text-slate-800 shadow-sm">
              {/* Kop Surat Kedinasan */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/logo-stp.png"
                    alt="Logo Solo Technopark"
                    className="w-16 h-16 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      PEMERINTAH KOTA SURAKARTA
                    </h3>
                    <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                      UPT KAWASAN SAINS DAN TEKNOLOGI SOLO TECHNOPARK
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pusat Inovasi, Vokasi, dan Kewirausahaan Teknologi Berbasis BLUD
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Jl. Ki Hajar Dewantara No.19, Jebres, Surakarta 57126 • Telp: (0271) 666628 • https://solotechnopark.id
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-black uppercase tracking-wider">
                    Draf Estimasi BLUD
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    No: STP/B2B-EST/{Date.now().toString().slice(-6)}
                  </p>
                </div>
              </div>

              {/* Judul Dokumen */}
              <div className="text-center">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  ESTIMASI PENAWARAN RESMI SEWA FASILITAS & PAKET EVENT B2B
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tanggal Terbit: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Rincian Instansi & Acara (2 Kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Instansi / Korporat Pemohon:
                  </span>
                  <span className="font-bold text-slate-900 block text-xs">
                    {agencyName || 'Instansi / Korporat Mitra'}
                  </span>
                  <span className="text-slate-600 block">
                    PIC: {picName || 'Perwakilan Mitra'} {picPosition ? `(${picPosition})` : ''}
                  </span>
                  <span className="text-slate-500 block">
                    Kontak: {picPhone || '-'} • {picEmail || '-'}
                  </span>
                  <span className="text-slate-600 block pt-1">
                    Survey Lokasi Fisik: <strong className={isSurveyRequested ? 'text-emerald-700' : 'text-slate-500'}>
                      {isSurveyRequested ? `Diminta (${preferredSurveyDate || 'Jadwal Menyusul'})` : 'Tidak Membutuhkan Survey'}
                    </strong>
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Spesifikasi Kegiatan:
                  </span>
                  <span className="font-bold text-slate-900 block text-xs">
                    {eventType}
                  </span>
                  <span className="text-slate-600 block">
                    Jadwal Rencana: {startDate ? `${startDate} s/d ${endDate || startDate}` : 'Menyesuaikan Jadwal'}
                  </span>
                  <span className="text-slate-600 block">
                    Durasi: <strong>{durationDays} Hari Operasional</strong>
                  </span>
                  <span className="text-slate-500 block">
                    Estimasi Peserta: {estimatedAttendance}
                  </span>
                </div>
              </div>

              {/* Tabel Rincian Anggaran */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5">Komponen Fasilitas / Layanan</th>
                      <th className="p-2.5 text-center">Durasi</th>
                      <th className="p-2.5 text-right">Tarif Satuan</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRoomsList.map((r) => {
                      const price = Number(r.priceValue) || 0;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">Sewa: {r.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Kapasitas: {r.capacity || 'Sesuai Tata Letak'} org • {r.location || 'Kawasan STP'}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-medium">{durationDays} Hari</td>
                          <td className="p-2.5 text-right text-slate-600 font-mono">{formatRupiah(price)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                            {formatRupiah(price * durationDays)}
                          </td>
                        </tr>
                      );
                    })}
                    {selectedAddonsList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">Add-on: {a.name}</div>
                          <div className="text-[10px] text-slate-400">{a.description}</div>
                        </td>
                        <td className="p-2.5 text-center font-medium">{durationDays} Hari</td>
                        <td className="p-2.5 text-right text-slate-600 font-mono">{formatRupiah(a.price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                          {formatRupiah(a.price * durationDays)}
                        </td>
                      </tr>
                    ))}
                    {discountAmount > 0 && (
                      <tr className="bg-emerald-50 text-emerald-800 font-bold">
                        <td colSpan={3} className="p-2.5 text-right">
                          Insentif Bundling Mitra B2B (Diskon Multi-Ruangan 10%):
                        </td>
                        <td className="p-2.5 text-right font-mono">- {formatRupiah(discountAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-900 text-white font-bold">
                      <td colSpan={3} className="p-3 text-right uppercase text-xs tracking-wider">
                        Total Estimasi Anggaran (PPK-BLUD):
                      </td>
                      <td className="p-3 text-right text-sm font-black text-emerald-400 font-mono">
                        {formatRupiah(finalEstimatedBudget)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Keterangan & Catatan Regulasi */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wide">Ketentuan & Catatan Resmi:</p>
                <p>1. Draf estimasi ini diterbitkan untuk asistensi penganggaran resmi internal instansi mitra pemohon.</p>
                <p>2. Penetapan jadwal resmi mengikat setelah persetujuan teknis dan penerbitan Bukti Pemesanan definitif.</p>
                <p>3. Seluruh pembayaran resmi ditujukan ke Rekening Kas Badan Layanan Umum Daerah (BLUD) Solo Technopark.</p>
                <p>4. Untuk koordinasi survey fisik (*site visit*), hubungi Helpdesk Layanan B2B STP: (0271) 666628 / 0812-3456-7890.</p>
              </div>

              {/* Blok Validasi Digital & Stempel */}
              <div className="pt-2 grid grid-cols-2 gap-8 items-end text-center text-xs">
                <div>
                  <p className="text-[11px] text-slate-500 mb-12">Perwakilan Instansi Pemohon,</p>
                  <p className="font-bold text-slate-900 underline">
                    {picName || '...................................................'}
                  </p>
                  <p className="text-[10px] text-slate-500">{picPosition || 'Penanggung Jawab Acara'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 mb-1">Surakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-bold text-indigo-900 uppercase">UPT KST Solo Technopark</p>
                  <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] font-black">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TECHNO SIGN DIGITAL VERIFIED</span>
                  </div>
                  <p className="font-bold text-slate-900 underline">TIM PENGELOLA FASILITAS BLUD</p>
                  <p className="text-[10px] text-slate-500">PPK-BLUD Kota Surakarta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
