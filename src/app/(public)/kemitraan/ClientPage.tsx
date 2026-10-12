// src/app/(public)/kemitraan/ClientPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Handshake,
  Cpu,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Clock,
  Layers,
  Award,
  Users,
  Loader2,
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';
import { partnershipService } from '@/services/partnership.service';
import { PartnershipType } from '@/types/partnership.types';
import { toast } from 'sonner';

const PARTNERSHIP_MODELS = [
  {
    id: 'VENUE_EVENT',
    title: 'Sewa Kawasan & MICE Event',
    icon: Building2,
    badge: 'Venue & Fasilitas',
    color: 'from-blue-600 to-indigo-700',
    description:
      'Penyelenggaraan konferensi internasional, pameran inovasi teknologi, hackathon, dan diklat kedinasan dengan kapasitas hingga 1.500 delegasi.',
    actionUrl: '/fasilitas',
    actionText: 'Simulasi Paket Acara B2B',
  },
  {
    id: 'LAB_MANUFACTURING',
    title: 'Co-Innovation Lab & Manufaktur Presisi',
    icon: Cpu,
    badge: 'Lab Riset Terapan',
    color: 'from-indigo-600 to-purple-700',
    description:
      'Pemanfaatan mesin CNC 5-Axis berkecepatan tinggi, simulator pengelasan underwater, otomasi robotika industri, dan Cyber Security Defense Hub.',
    actionUrl: '/fasilitas',
    actionText: 'Lihat Fasilitas Lab',
  },
  {
    id: 'TALENT_RECRUITMENT',
    title: 'Industrial Talent Pipeline',
    icon: GraduationCap,
    badge: 'Penyerapan Talenta',
    color: 'from-emerald-600 to-teal-700',
    description:
      'Akses prioritas penyaluran tenaga kerja vokasi terlatih, alumni sertifikasi industri BNSP, dan rekrutmen talenta IT berbakat dari akademi STP.',
    actionUrl: '/karir',
    actionText: 'Kanal Bursa Karir',
  },
  {
    id: 'STARTUP_INCUBATION',
    title: 'Inkubasi Startup & Program CSR',
    icon: Rocket,
    badge: 'Venture & Hilirisasi',
    color: 'from-amber-600 to-orange-700',
    description:
      'Program bapak asuh UMKM/startup teknologi binaan STP, skema matching fund penelitian, dan program CSR korporasi berdampak sosial nyata.',
    actionUrl: '/ekosistem',
    actionText: 'Eksplorasi Ekosistem Startup',
  },
];

export default function KemitraanClientPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Form State
  const [agencyName, setAgencyName] = useState('');
  const [agencyType, setAgencyType] = useState<any>('BUMN / BUMD');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [partnershipType, setPartnershipType] = useState<PartnershipType>('VENUE_EVENT');
  const [subject, setSubject] = useState('');
  const [proposalSummary, setProposalSummary] = useState('');
  const [estimatedTimeline, setEstimatedTimeline] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !picName.trim() || !picPhone.trim() || !subject.trim()) {
      toast.error('Mohon lengkapi kolom bertanda bintang (*)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await partnershipService.submitInquiry({
        agencyName,
        agencyType,
        picName,
        picPosition: picPosition || 'Perwakilan Resmi',
        picEmail: picEmail || `${picPhone.replace(/\D/g, '')}@b2b.client.com`,
        picPhone,
        partnershipType,
        subject,
        proposalSummary,
        estimatedTimeline: estimatedTimeline || undefined,
      });

      if (res.success && res.id) {
        setSubmittedTicket(res.id);
        toast.success('Pengajuan Kemitraan Berhasil Dikirimkan!', {
          description: 'Tim Partnership Desk Solo Technopark akan segera menghubungi Anda.',
        });
      } else {
        toast.error('Gagal Mengirimkan', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Gagal mengirimkan pengajuan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionContainer accent="indigo" width="default">
      {/* ─── Hero Section ─── */}
      <PageHero
        title="Gerbang Kemitraan Industri & B2B Hub"
        subtitle="Membuka sinergi strategis antara BUMN, Korporasi Multinasional, Kementerian, dan Perguruan Tinggi dengan infrastruktur riset terapan dan talenta teknologi terdepan Solo Technopark."
        accentColor="indigo"
        badge={{
          label: 'Corporate & Government Partnership Desk',
          icon: <Handshake className="w-3.5 h-3.5 text-indigo-600" />,
        }}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Ekosistem', href: '/ekosistem' },
          { label: 'Kemitraan Industri' },
        ]}
      />

      <div className="space-y-12 pt-6 sm:pt-8">
        {/* ─── Highlight Nilai Kemitraan ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 block">50+</span>
            <span className="text-xs font-bold text-slate-700 block">Mitra Korporasi & Industri</span>
            <span className="text-[11px] text-slate-400 block leading-tight">
              BUMN, Tech Giants & Perusahaan Manufaktur
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 block">15+</span>
            <span className="text-xs font-bold text-slate-700 block">Laboratorium Riset & Vokasi</span>
            <span className="text-[11px] text-slate-400 block leading-tight">
              CNC, Cyber Defense, AI, Gaming & Underwater Welding
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 block">1.500+</span>
            <span className="text-xs font-bold text-slate-700 block">Kapasitas Delegasi MICE</span>
            <span className="text-[11px] text-slate-400 block leading-tight">
              Auditorium berstandar internasional & ruang sidang VIP
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">100%</span>
            <span className="text-xs font-bold text-slate-700 block">Kepatuhan PPK-BLUD</span>
            <span className="text-[11px] text-slate-400 block leading-tight">
              Faktur Pajak, SPK & Tata Kelola Keuangan Terbuka
            </span>
          </div>
        </div>

        {/* ─── 4 Pilar Model Kemitraan Strategis ─── */}
        <div className="space-y-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
              Model Kolaborasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4 Jalur Kemitraan Strategis Solo Technopark
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pilih model kerjasama yang paling selaras dengan sasaran strategis institusi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
            {PARTNERSHIP_MODELS.map((model) => {
              const IconComponent = model.icon;
              return (
                <div
                  key={model.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {model.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {model.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={model.actionUrl}
                      className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>{model.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Formulir Permohonan Kemitraan Resmi (Request for Proposal / RFP) ─── */}
        <div id="form-kemitraan" className="rounded-3xl bg-white border border-slate-200/90 shadow-md p-6 sm:p-10 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Formulir Penjajakan Kerjasama Resmi
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ajukan Request for Proposal (RFP) atau Inisiasi MoU
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Permohonan Anda akan tercatat langsung di sistem administrasi UPT Solo Technopark dan ditindaklanjuti oleh PIC Partnership Desk dalam 1x24 jam kerja.
            </p>
          </div>

          {submittedTicket ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-950">
                Permohonan Kemitraan Berhasil Diajukan!
              </h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                ID Tiket Kemitraan Anda: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedTicket}</strong>. Tim Kemitraan Solo Technopark akan segera menghubungi kontak PIC Anda.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubmittedTicket(null)}
                className="rounded-xl text-xs font-bold"
              >
                Kirim Pengajuan Baru Lainnya
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Instansi / Perusahaan / Kampus *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Bank Mandiri (Persero) Tbk"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Instansi *
                  </label>
                  <select
                    value={agencyType}
                    onChange={(e) => setAgencyType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="BUMN / BUMD">BUMN / BUMD</option>
                    <option value="Kementerian / Instansi Pemerintah">Kementerian / Instansi Pemerintah</option>
                    <option value="Perusahaan Swasta / Multinasional">Perusahaan Swasta / Multinasional</option>
                    <option value="Perguruan Tinggi / Lembaga Riset">Perguruan Tinggi / Lembaga Riset</option>
                    <option value="Asosiasi / Organisasi Profesi">Asosiasi / Organisasi Profesi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap PIC *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Penanggung Jawab"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan PIC
                  </label>
                  <input
                    type="text"
                    placeholder="Kadiv / PPK / Manajer CSR"
                    value={picPosition}
                    onChange={(e) => setPicPosition(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Resmi *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Resmi Kantor
                  </label>
                  <input
                    type="email"
                    placeholder="kemitraan@perusahaan.co.id"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bidang Kerjasama yang Diminati *
                  </label>
                  <select
                    value={partnershipType}
                    onChange={(e) => setPartnershipType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="VENUE_EVENT">Sewa Fasilitas Acara & Penyelenggaraan MICE</option>
                    <option value="LAB_MANUFACTURING">Pemanfaatan Lab Presisi / Uji Manufaktur</option>
                    <option value="TALENT_RECRUITMENT">Penyaluran Talenta & Rekrutmen Vokasi STP</option>
                    <option value="STARTUP_INCUBATION">Inkubasi Startup, Matching Fund & Program CSR</option>
                    <option value="MOU_GENERAL">Nota Kesepahaman (MoU) Kelembagaan Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Perihal Kerjasama *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Permohonan Penyelenggaraan Konferensi Nasional AI & Industri 2026"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Kerangka Acuan Kerjasama (TOR/KAK Singkat)
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan gambaran umum kegiatan, tujuan kerjasama, atau kebutuhan sarana yang diharapkan..."
                  value={proposalSummary}
                  onChange={(e) => setProposalSummary(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Perkiraan Linimasa Pelaksanaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kuartal IV 2026 / Bulan November 2026"
                  value={estimatedTimeline}
                  onChange={(e) => setEstimatedTimeline(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  *Data Anda dijamin kerahasiaannya di bawah standar privasi UPT Solo Technopark.
                </span>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Permohonan Kemitraan</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
