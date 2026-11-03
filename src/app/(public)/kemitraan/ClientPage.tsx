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
  Landmark,
  Briefcase,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { partnershipService } from '@/services/partnership.service';
import { PartnershipType } from '@/types/partnership.types';
import { useActiveFinancingSchemes } from '@/hooks/useFinancing';
import { usePublicOpenProjects } from '@/hooks/useOpenProjects';
import FinancingSchemeSection from './components/FinancingSchemeSection';
import OpenProjectSection from './components/OpenProjectSection';
import PartnerShowcase from './components/PartnerShowcase';
import ImpactStatsSection from './components/ImpactStatsSection';
import { toast } from 'sonner';

const PARTNERSHIP_MODELS = [
  {
    id: 'FINANCING_TRAINING',
    title: 'Pembiayaan & Beasiswa Pelatihan',
    icon: Landmark,
    badge: 'Finansial & Perbankan',
    color: 'from-blue-600 to-indigo-700',
    description:
      'Penyediaan fasilitas kredit vokasi berbunga lunak (KUR), cicilan 0% syariah, dan skema beasiswa penuh ikatan kerja bersama institusi perbankan dan CSR korporasi.',
    actionUrl: '#pembiayaan-pelatihan',
    actionText: 'Eksplorasi Skema Finansial',
  },
  {
    id: 'OPEN_PROJECT',
    title: 'Open Project & Industrial Taskforce',
    icon: Briefcase,
    badge: 'Bursa Proyek Nyata',
    color: 'from-emerald-600 to-teal-700',
    description:
      'Pelemparan kebutuhan rekayasa, perancangan prototipe manufaktur presisi, IoT, dan audit siber langsung ke taskforce alumni bersertifikasi dengan penjaminan mutu STP.',
    actionUrl: '#open-project',
    actionText: 'Lihat Daftar Proyek',
  },
  {
    id: 'TALENT_RECRUITMENT',
    title: 'Industrial Talent Pipeline',
    icon: GraduationCap,
    badge: 'Penyerapan Tenaga Kerja',
    color: 'from-teal-600 to-cyan-700',
    description:
      'Akses prioritas penyaluran tenaga kerja vokasi terlatih, lulusan sertifikasi BNSP/internasional, dan rekrutmen talenta IT berbakat dari akademi vokasi STP.',
    actionUrl: '/karir',
    actionText: 'Bursa Karir & Talenta',
  },
  {
    id: 'LAB_MANUFACTURING',
    title: 'Co-Innovation Lab & Manufaktur Presisi',
    icon: Cpu,
    badge: 'Lab Riset Terapan',
    color: 'from-indigo-600 to-purple-700',
    description:
      'Pemanfaatan mesin CNC 5-Axis berkecepatan tinggi, simulator pengelasan underwater, otomasi robotika industri, dan Cyber Security Defense Center.',
    actionUrl: '/fasilitas',
    actionText: 'Lihat Fasilitas Lab',
  },
  {
    id: 'STARTUP_INCUBATION',
    title: 'Inkubasi Startup, Joint Venture & CSR',
    icon: Rocket,
    badge: 'Venture & Hilirisasi',
    color: 'from-amber-600 to-orange-700',
    description:
      'Program bapak asuh UMKM dan startup teknologi binaan STP, skema matching fund penelitian, serta hilirisasi produk inovasi ke pasar komersial.',
    actionUrl: '/ekosistem',
    actionText: 'Ekosistem Inkubasi',
  },
  {
    id: 'VENUE_EVENT',
    title: 'Sewa Kawasan & MICE Event B2B',
    icon: Building2,
    badge: 'Venue & Fasilitas',
    color: 'from-slate-700 to-slate-900',
    description:
      'Penyelenggaraan konferensi internasional, pameran inovasi teknologi, hackathon, dan diklat kedinasan dengan kapasitas hingga 1.500 delegasi.',
    actionUrl: '/fasilitas',
    actionText: 'Simulasi Sewa Kawasan',
  },
];

export default function KemitraanClientPage() {
  const { data: financingSchemes = [] } = useActiveFinancingSchemes();
  const { data: openProjects = [] } = usePublicOpenProjects();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Form State
  const [agencyName, setAgencyName] = useState('');
  const [agencyType, setAgencyType] = useState<any>('Perusahaan Swasta / Multinasional');
  const [picName, setPicName] = useState('');
  const [picPosition, setPicPosition] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [partnershipType, setPartnershipType] = useState<PartnershipType>('FINANCING_TRAINING');
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
          description: 'Tim Strategic Partnership Desk Solo Technopark akan segera menghubungi Anda.',
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
      {/* Page Hero */}
      <PageHero
        title="Pusat Sinergi Industri, Perbankan & Ekosistem Teknologi"
        subtitle="Membangun kemitraan berdampak nyata: dari penyediaan fasilitas kredit pelatihan vokasi berbunga lunak, pelemparan proyek industri ke alumni, hingga riset terapan manufaktur presisi berstandar global."
        accentColor="indigo"
        badge={{
          label: 'Industrial & Financial Partnership Ecosystem',
          icon: <Handshake className="w-3.5 h-3.5 text-indigo-400" />,
        }}
      />

      {/* Quick Access Anchor Pill Bar */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 scrollbar-none">
        <a
          href="#pembiayaan-pelatihan"
          className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Landmark className="w-3.5 h-3.5 text-indigo-600" />
          <span>🏦 Pembiayaan Pelatihan</span>
        </a>
        <a
          href="#open-project"
          className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
          <span>🎯 Open Project Marketplace</span>
        </a>
        <a
          href="#model-kerjasama"
          className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-slate-600" />
          <span>Skema Kemitraan</span>
        </a>
        <a
          href="#mitra-resmi"
          className="px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Jejaring Mitra</span>
        </a>
        <a
          href="#form-inquiry"
          className="px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ajukan Kerjasama Baru</span>
        </a>
      </div>

      {/* 1. SECTION PEMBIAYAAN PELATIHAN (FEATURE BARU PERBANKAN) */}
      <FinancingSchemeSection schemes={financingSchemes} />

      {/* 2. SECTION OPEN PROJECT MARKETPLACE (FEATURE BARU ALUMNI-MITRA) */}
      <OpenProjectSection projects={openProjects} />

      {/* 3. SECTION STATISTIK DAMPAK & KINERJA */}
      <div className="pt-6">
        <ImpactStatsSection />
      </div>

      {/* 4. SECTION 6 MODEL KEMITRAAN VISIONER */}
      <div id="model-kerjasama" className="space-y-6 pt-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">
            Pilar Kolaborasi Multisektor
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Pilihan Skema Kemitraan Strategis
          </h2>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Pilih jalur kerjasama yang paling sesuai dengan visi strategis perusahaan, target penyerapan talenta, atau agenda tanggung jawab sosial (CSR) Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PARTNERSHIP_MODELS.map((model) => {
            const Icon = model.icon;
            return (
              <div
                key={model.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-indigo-300 transition-all group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`p-3 rounded-2xl bg-gradient-to-br ${model.color} text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold border-slate-200">
                      {model.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {model.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                      {model.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-3 border-t border-slate-100 flex items-center justify-between">
                  {model.actionUrl.startsWith('#') ? (
                    <a
                      href={model.actionUrl}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      <span>{model.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={model.actionUrl}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      <span>{model.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. SECTION MITRA RESMI */}
      <div id="mitra-resmi" className="pt-6">
        <PartnerShowcase />
      </div>

      {/* 6. FORMULIR PENGAJUAN KEMITRAAN (B2B DESK) */}
      <div id="form-inquiry" className="pt-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[11px] font-bold">
                <Send className="w-3.5 h-3.5" />
                <span>Strategic B2B Partnership Desk</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black">
                Formulir Pengajuan Inisiasi Kerjasama
              </h2>
              <p className="text-xs text-indigo-200/80 max-w-xl">
                Isi formulir berikut untuk memulai penjajakan kemitraan MoU, skema pembiayaan perbankan, penyerapan tenaga kerja, maupun riset terapan bersama UPT Solo Technopark.
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/mitra">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs gap-2"
                >
                  <Building2 className="w-4 h-4 text-indigo-300" />
                  <span>Portal Mitra Terdaftar</span>
                </Button>
              </Link>
            </div>
          </div>

          {submittedTicket ? (
            <div className="p-8 md:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Permohonan Inisiasi Kemitraan Berhasil Terkirim!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Nomor Tiket Anda: <strong className="text-indigo-600 font-mono text-sm">{submittedTicket}</strong>. Tim Divisi Kemitraan & Kerjasama STP akan menghubungi Anda via WhatsApp & Email maksimal dalam 1x24 jam kerja.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setAgencyName('');
                    setPicName('');
                    setSubject('');
                    setProposalSummary('');
                  }}
                  className="rounded-xl text-xs font-bold bg-indigo-600 text-white"
                >
                  Kirim Pengajuan Baru Lainnya
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Perusahaan / Institusi / Instansi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Industri Presisi Nusantara"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Lembaga / Instansi *
                  </label>
                  <select
                    value={agencyType}
                    onChange={(e) => setAgencyType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Perusahaan Swasta / Multinasional">Perusahaan Swasta / Multinasional</option>
                    <option value="BUMN / BUMD">BUMN / BUMD</option>
                    <option value="Kementerian / Instansi Pemerintah">Kementerian / Instansi Pemerintah</option>
                    <option value="Perguruan Tinggi / Lembaga Riset">Perguruan Tinggi / Lembaga Riset</option>
                    <option value="Asosiasi / Organisasi Profesi">Asosiasi / Organisasi Profesi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama PIC Kerjasama *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap perwakilan"
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
                    placeholder="Contoh: VP of Human Capital / CSR Lead"
                    value={picPosition}
                    onChange={(e) => setPicPosition(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Telepon / WhatsApp PIC *
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
                    Email Resmi Perusahaan / Kantor
                  </label>
                  <input
                    type="email"
                    placeholder="partnership@perusahaan.co.id"
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  >
                    <option value="FINANCING_TRAINING">Pembiayaan Pelatihan, KUR Lunak & Beasiswa CSR</option>
                    <option value="OPEN_PROJECT">Open Project Marketplace (Pekerjaan ke Alumni)</option>
                    <option value="TALENT_RECRUITMENT">Penyaluran Talenta & Rekrutmen Vokasi STP</option>
                    <option value="LAB_MANUFACTURING">Pemanfaatan Lab Presisi & Uji Manufaktur (CNC/Welding)</option>
                    <option value="CONTENT_CO_BRANDING">Co-Branding Kurikulum & Akademi Industri</option>
                    <option value="STARTUP_INCUBATION">Inkubasi Startup, Joint Venture & Hilirisasi</option>
                    <option value="VENUE_EVENT">Sewa Fasilitas Acara & Penyelenggaraan MICE</option>
                    <option value="MOU_GENERAL">Nota Kesepahaman (MoU) Kelembagaan Umum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Perihal / Judul Kerjasama *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sinergi Penyaluran KUR Vokasi dan Pelatihan Manufaktur Presisi 2026"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi / Kerangka Acuan Kerjasama (TOR Singkat)
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kebutuhan kerjasama Anda, target output, fasilitas yang ingin digunakan, atau komitmen kuota yang disiapkan..."
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
                  placeholder="Contoh: Kuartal I 2026 / Bulan Januari 2026"
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
