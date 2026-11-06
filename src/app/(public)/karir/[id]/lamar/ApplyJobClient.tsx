// src/app/(public)/karir/[id]/lamar/ApplyJobClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Send,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Mail,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Phone,
  BookmarkCheck,
  Search,
  MessageSquare,
  Linkedin,
  Instagram,
  Briefcase,
  GraduationCap,
  Banknote,
  Clock,
  ArrowUpRight,
  FileText,
  UserCheck,
  BadgeAlert,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { JobListing } from '@/types/job.types';
import { useAuth } from '@/lib/AuthContext';
import {
  useSubmitJobApplication,
  useMarkExternalJobApplied,
  useMyJobApplications,
} from '@/hooks/useJobApplications';
import {
  getLinkedInJobsUrl,
  getGoogleJobsUrl,
  getJobstreetSearchUrl,
  getGlintsSearchUrl,
  extractDomain,
  getWhatsappChatUrl,
  getMailtoLink,
  getInstagramSearchUrl,
  getKemnakerSearchUrl,
  getOfficialVerificationSearchUrl,
} from '@/utils/jobContactUtils';
import { formatSalary } from '@/utils/format';
import { toast } from 'sonner';

interface ApplyJobClientProps {
  idOrSlug: string;
  initialJob: JobListing;
}

export default function ApplyJobClient({ idOrSlug, initialJob }: ApplyJobClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const job = initialJob;

  const submitAppMutation = useSubmitJobApplication();
  const markExternalMutation = useMarkExternalJobApplied();
  const { data: myApps = [] } = useMyJobApplications();

  // Mode tab: 'official_channels' (Saluran Lamar Resmi) | 'stp_recommendation' (Bantuan Pendampingan STP)
  const [activeTab, setActiveTab] = useState<'official_channels' | 'stp_recommendation'>(
    'official_channels'
  );

  // Form states untuk rekomendasi STP
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);
  const [hasCopiedPhone, setHasCopiedPhone] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Cek apakah lowongan ini sudah pernah dilamar atau ditandai
  const existingApp = job ? myApps.find((app) => app.jobId === job.id) : null;
  const hasApplied = Boolean(existingApp);

  // Inisialisasi data dari akun user jika login
  useEffect(() => {
    if (user) {
      setApplicantName(user.displayName || '');
      setApplicantEmail(user.email || '');
    }
  }, [user]);

  // Set default program dari lowongan jika ada kurikulum selaras
  useEffect(() => {
    if (job) {
      if (job.relevantTrainingPrograms && job.relevantTrainingPrograms.length > 0) {
        setSelectedProgram(job.relevantTrainingPrograms[0]);
      } else {
        setSelectedProgram('');
      }
    }
  }, [job]);

  const linkedInUrl = getLinkedInJobsUrl(job);
  const googleJobsUrl = getGoogleJobsUrl(job);
  const jobstreetUrl = getJobstreetSearchUrl(job);
  const portalDomain = extractDomain(job.applicationUrl);
  const instagramUrl = getInstagramSearchUrl(job);
  const kemnakerUrl = getKemnakerSearchUrl(job);
  const verificationUrl = getOfficialVerificationSearchUrl(job);

  const contactPhone = job.contactWhatsapp || job.contactPhone;
  const whatsappUrl = contactPhone ? getWhatsappChatUrl(contactPhone, job, applicantName) : null;
  const mailtoLink = job.applicationEmail
    ? getMailtoLink(job.applicationEmail, job, applicantName)
    : null;

  const handleCopyEmail = () => {
    if (!job.applicationEmail) return;
    navigator.clipboard.writeText(job.applicationEmail);
    setHasCopiedEmail(true);
    toast.success('Alamat Email Rekruter Berhasil Disalin!');
    setTimeout(() => setHasCopiedEmail(false), 2500);
  };

  const handleCopyPhone = () => {
    if (!contactPhone) return;
    navigator.clipboard.writeText(contactPhone);
    setHasCopiedPhone(true);
    toast.success('Nomor Kontak HRD Berhasil Disalin!');
    setTimeout(() => setHasCopiedPhone(false), 2500);
  };

  const handleMarkExternalApplied = async (channelSource: string) => {
    try {
      await markExternalMutation.mutateAsync({
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company,
        source: channelSource,
        applicationUrl: job.applicationUrl || linkedInUrl,
      });
      setIsSubmittedSuccess(true);
      toast.success(`Lamaran via ${channelSource} tercatat di Riwayat Lamaran Anda.`);
    } catch {
      // Ditangani oleh mutasi
    }
  };

  const handleSubmitStpApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      toast.error('Nama Lengkap Wajib Diisi');
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      toast.error('Email Tidak Valid');
      return;
    }
    if (!applicantPhone.trim()) {
      toast.error('Nomor WhatsApp / HP Wajib Diisi untuk Komunikasi HRD');
      return;
    }

    try {
      await submitAppMutation.mutateAsync({
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        applicantPhone: applicantPhone.trim(),
        programTaken: selectedProgram || 'Alumni / Talenta Umum Solo Technopark',
        portfolioUrl: portfolioUrl.trim() || undefined,
        coverNote: coverNote.trim() || undefined,
        skills: job.skills.slice(0, 5),
      });
      setIsSubmittedSuccess(true);
      toast.success('Pengajuan Rekomendasi Berhasil Dikirimkan ke STP!');
    } catch {
      toast.error('Gagal mengirimkan pengajuan, silakan coba lagi');
    }
  };

  const formattedSalary = React.useMemo(() => {
    if (!job.salary.isDisclosed) return 'Gaji Kompetitif (Dirahasiakan)';
    const curr = job.salary.currency || 'IDR';
    if (job.salary.min && job.salary.max) {
      return `${formatSalary(job.salary.min, curr)} - ${formatSalary(job.salary.max, curr)}`;
    }
    if (job.salary.min) return `Mulai ${formatSalary(job.salary.min, curr)}`;
    if (job.salary.max) return `Hingga ${formatSalary(job.salary.max, curr)}`;
    return 'Gaji Dirahasiakan';
  }, [job.salary]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-6">
      <SectionContainer>
        {/* ─── Breadcrumb Navigasi & Back Button ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href={`/karir/${job.id}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-400 group-hover:bg-emerald-50 transition-all shadow-2xs">
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-emerald-700 transition-colors" />
            </div>
            <span>Kembali ke Detail Lowongan</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link href="/karir" className="hover:text-emerald-600 transition-colors">
              Bursa Karir
            </Link>
            <span>/</span>
            <Link href={`/karir/${job.id}`} className="hover:text-emerald-600 transition-colors truncate max-w-[160px] sm:max-w-[260px]">
              {job.title}
            </Link>
            <span>/</span>
            <span className="text-emerald-700 font-bold">Lamar Sekarang</span>
          </div>
        </div>

        {/* ─── Hero Banner Lowongan (Full Width, Matching Overall Site Theme) ─── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/40 p-6 sm:p-8 text-white shadow-xl mb-8">
          {/* Subtle Glow Accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Penyaluran Karir Terverifikasi Solo Technopark</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
                  {job.workType} • {job.workSetup}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {job.title}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-emerald-200/90 mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{job.company}</span>
                  <span className="text-emerald-600">•</span>
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{job.location}</span>
                </p>
              </div>
            </div>

            {/* Estimasi Gaji Card Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shrink-0 min-w-[220px]">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                Estimasi Kompensasi
              </span>
              <div className="text-lg sm:text-xl font-black text-white mt-1">
                {formattedSalary}
              </div>
              <span className="text-[11px] text-slate-300 block mt-0.5">
                Periode {job.salary.period}
              </span>
            </div>
          </div>

          {/* ─── Mode Tab Selection Bar ─── */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('official_channels')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'official_channels'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>1. Saluran Lamar Resmi & Kontak HRD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stp_recommendation')}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'stp_recommendation'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Bantuan Rekomendasi & Penyaluran STP</span>
              <Badge className="bg-amber-400 text-amber-950 text-[10px] ml-1">Alumni / BKK</Badge>
            </button>
          </div>
        </div>

        {/* ─── Main Grid Layout (8 Kolom Kiri, 4 Kolom Kanan) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Kolom Kiri: Form & Saluran Pelamaran (8 Kolom) ─── */}
          <div className="lg:col-span-8 space-y-6">
            {hasApplied && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-950 shadow-xs">
                <div className="flex items-center gap-2.5 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Lowongan ini sudah tercatat dalam pangkalan data pelamaran Anda (Status:{' '}
                    <strong>{existingApp?.statusNote || 'Tercatat'}</strong>).
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[11px] shrink-0">Tersimpan</Badge>
              </div>
            )}

            {isSubmittedSuccess && (
              <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-emerald-950">
                      Lamaran Berhasil Tercatat!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Data Anda telah tersimpan dan tercatat di sistem pemantauan karir Solo Technopark.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href={`/karir/${job.id}`}>
                    <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-900 bg-white">
                      Kembali ke Detail Posisi
                    </Button>
                  </Link>
                  <Link href="/karir">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Jelajahi Lowongan Lainnya
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ─── TAB 1: SALURAN LAMAR RESMI & KONTAK HRD (DEFAULT) ─── */}
            {activeTab === 'official_channels' && (
              <div className="space-y-6">
                {/* 1. Kontak Langsung HRD (Email & WhatsApp) */}
                {(job.applicationEmail || contactPhone) && (
                  <div className="public-card bg-white rounded-3xl border border-teal-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-teal-700" />
                        </span>
                        <div>
                          <h2 className="text-sm sm:text-base font-black text-slate-900">
                            Kontak Rekrutmen Langsung HRD
                          </h2>
                          <p className="text-xs text-slate-500">
                            Paling direkomendasikan karena langsung masuk ke kotak masuk tim rekruter tanpa hambatan DNS/server web.
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-teal-600 text-white text-[10px] hidden sm:inline-flex">
                        100% Terverifikasi
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Email HRD */}
                      {job.applicationEmail && (
                        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex flex-col justify-between gap-3 shadow-2xs">
                          <div>
                            <span className="text-[11px] font-black text-teal-800 uppercase tracking-wider block">
                              Alamat Email Resmi Rekrutmen
                            </span>
                            <span className="font-extrabold text-sm text-teal-950 block truncate mt-1" title={job.applicationEmail}>
                              {job.applicationEmail}
                            </span>
                            <p className="text-xs text-teal-800/80 mt-1 leading-snug">
                              Kirimkan berkas CV, portofolio, dan sertifikat pelatihan STP dengan subjek terstandarisasi.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-teal-100">
                            {mailtoLink && (
                              <a
                                href={mailtoLink}
                                className="flex-1"
                                onClick={() => handleMarkExternalApplied('Email HRD')}
                              >
                                <Button
                                  className="w-full h-9 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Draft Email CV</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyEmail}
                              title="Salin Alamat Email"
                              className="h-9 px-3 text-xs font-semibold border-teal-300 text-teal-950 hover:bg-teal-100 rounded-xl shrink-0"
                            >
                              {hasCopiedEmail ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp / Telepon HRD */}
                      {contactPhone && (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between gap-3 shadow-2xs">
                          <div>
                            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                              WhatsApp / Hotline Rekrutmen
                            </span>
                            <span className="font-extrabold text-sm text-emerald-950 block truncate mt-1">
                              {contactPhone}
                            </span>
                            <p className="text-xs text-emerald-800/80 mt-1 leading-snug">
                              Hubungi tim HRD menggunakan format pesan sapaan pengenalan diri yang sopan dan terstruktur.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1"
                                onClick={() => handleMarkExternalApplied('WhatsApp HRD')}
                              >
                                <Button
                                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Chat WhatsApp</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyPhone}
                              title="Salin Nomor WhatsApp"
                              className="h-9 px-3 text-xs font-semibold border-emerald-300 text-emerald-950 hover:bg-emerald-100 rounded-xl shrink-0"
                            >
                              {hasCopiedPhone ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Validasi Media Sosial & Poster Resmi di Instagram */}
                <div className="public-card bg-white rounded-3xl border border-rose-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                        <Instagram className="w-4 h-4 text-rose-600" />
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900">
                          Validasi Poster Loker di Instagram
                        </h2>
                        <p className="text-xs text-slate-500">
                          Di Indonesia, poster pengumuman resmi di Instagram adalah bukti paling valid untuk kualifikasi dan syarat rekrutmen.
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-rose-600 text-white text-[10px]">
                      Paling Valid di Indonesia
                    </Badge>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-purple-50/60 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {job.instagramUrl ? `Akun Instagram Resmi (${job.company})` : 'Cari Poster & Flyer Loker di Instagram'}
                        </span>
                        <Badge className="text-[10px] bg-rose-600 text-white border-0">
                          Flyer Asli
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        Lihat pamflet kualifikasi resmi, kontak PIC, dan tanggal batas akhir rekrutmen dari akun terverifikasi.
                      </p>
                    </div>

                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto shrink-0"
                    >
                      <Button className="w-full sm:w-auto h-10 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-sm">
                        <Instagram className="w-4 h-4" />
                        <span>Buka Akun Instagram Resmi</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>

                {/* 3. Portal Karir Terpercaya Indonesia (Bebas Login-Wall / Captcha) */}
                <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-slate-900">
                          Portal Karir Terpercaya & Agregator Resmi
                        </h2>
                        <p className="text-xs text-slate-500">
                          Pilihan portal rekrutmen teruji di Indonesia tanpa terhalang proteksi *login-wall* atau *captcha*.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* JobStreet ID */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Briefcase className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-950 transition-colors">
                            Lamar via JobStreet Indonesia
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-900 border-amber-300">
                            #1 di Indonesia
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 pl-9 leading-snug">
                          Cari dan lamar lowongan <strong>{job.title}</strong> di JobStreet ID tanpa kendala verifikasi bot.
                        </p>
                      </div>

                      <a
                        href={jobstreetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 pl-9 sm:pl-0"
                        onClick={() => handleMarkExternalApplied('JobStreet ID')}
                      >
                        <Button variant="outline" className="w-full sm:w-auto h-9 border-amber-300 text-amber-950 hover:bg-amber-100 font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs">
                          <span>Buka JobStreet ID</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>

                    {/* SIAPkerja Kemnaker RI */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-950 transition-colors">
                            Verifikasi Izin & Lowongan di KarirHub Kemnaker
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            SIAPkerja RI
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 pl-9 leading-snug">
                          Periksa legalitas badan usaha dan lowongan aktif yang dilaporkan resmi ke Kementerian Ketenagakerjaan RI.
                        </p>
                      </div>

                      <a
                        href={kemnakerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 pl-9 sm:pl-0"
                      >
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto h-9 border-blue-300 text-blue-900 hover:bg-blue-100 font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs"
                        >
                          <span>Cek SIAPkerja</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>

                    {/* Google Jobs Search */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Search className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-slate-950 transition-colors">
                            Telusuri Pengumuman Resmi di Google Jobs
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-9 leading-snug">
                          Cek edaran pengumuman PDF resmi, berita Disnaker, atau siaran pers rekrutmen posisi {job.title}.
                        </p>
                      </div>

                      <a
                        href={googleJobsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 pl-9 sm:pl-0"
                      >
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto h-9 border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-xl gap-1.5 shadow-2xs"
                        >
                          <span>Telusuri Google</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>

                    {/* LinkedIn Jobs */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Linkedin className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                            Lamar via LinkedIn Jobs Resmi
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                            Butuh Akun
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 pl-9 leading-snug">
                          Buka postingan lowongan di platform profesional LinkedIn (pastikan Anda sudah login akun LinkedIn agar tidak terkena verifikasi bot).
                        </p>
                      </div>

                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 pl-9 sm:pl-0"
                        onClick={() => handleMarkExternalApplied('LinkedIn Jobs')}
                      >
                        <Button variant="outline" className="w-full sm:w-auto h-9 border-blue-300 text-blue-900 hover:bg-blue-100 font-bold text-xs rounded-xl gap-1.5 shadow-2xs">
                          <span>Buka LinkedIn</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 4. Portal Web Perusahaan (Eksternal) dengan Catatan Fail-Safe */}
                {job.applicationUrl && (
                  <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        Situs Web / Portal Karir Perusahaan (Eksternal)
                      </h2>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm text-slate-900">
                          Portal Karir Perusahaan {portalDomain ? `(${portalDomain})` : ''}
                        </span>
                        <p className="text-xs text-slate-500 leading-snug">
                          Tautan formulir rekrutmen dari domain website eksternal perusahaan.
                        </p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Catatan: Jika server website luar tidak dapat dijangkau (Error 521 / DNS), silakan gunakan opsi Email HRD atau Instagram di atas.
                            </span>
                          </span>
                        </div>
                      </div>

                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0"
                        onClick={() => handleMarkExternalApplied(portalDomain || 'Portal Resmi Perusahaan')}
                      >
                        <Button className="w-full sm:w-auto h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-xs">
                          <span>Kunjungi Situs Web</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: BANTUAN REKOMENDASI & PENYALURAN STP ─── */}
            {activeTab === 'stp_recommendation' && (
              <div className="public-card bg-white rounded-3xl border border-emerald-300 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Formulir Pendampingan & Rekomendasi Karir Solo Technopark
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                      Layanan khusus bagi alumni pelatihan dan talenta binaan Solo Technopark. Berkas Anda akan diverifikasi oleh Tim Hubungan Industri STP dan diteruskan secara prioritas ke HRD {job.company}.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitStpApplication} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">
                        Nama Lengkap Pelamar <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Contoh: Budi Santoso, S.T."
                        className="h-11 rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">
                        Alamat Email Aktif <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="budi.santoso@email.com"
                        className="h-11 rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">
                        Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="081234567890"
                        className="h-11 rounded-xl text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700">
                        Tautan Portofolio / LinkedIn / Google Drive
                      </label>
                      <Input
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username atau link CV"
                        className="h-11 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      Program Pelatihan / Diklat STP yang Pernah Diikuti
                    </label>
                    <Input
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      placeholder="Contoh: Pelatihan Operator Mesin CNC Milling 5-Axis"
                      className="h-11 rounded-xl text-xs sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-400">
                      Sertakan program pelatihan di Solo Technopark agar masuk ke jalur prioritas penyaluran talenta binaan.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      Catatan Pengantar / Cover Letter Ringkas (Opsional)
                    </label>
                    <Textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Jelaskan secara singkat kompetensi utama, portofolio proyek unggulan, dan kesiapan Anda bergabung..."
                      className="rounded-xl text-xs sm:text-sm min-h-[110px]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitAppMutation.isPending}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
                    >
                      {submitAppMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses Rekomendasi STP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Berkas & Ajukan Rekomendasi STP</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ─── Kolom Kanan: Sticky Sidebar Ringkasan (4 Kolom) ─── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Card Ringkasan Lowongan */}
            <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-800 text-lg shrink-0">
                  {job.companyLogo ? (
                    <Image
                      src={job.companyLogo}
                      alt={job.company}
                      width={48}
                      height={48}
                      className="rounded-2xl object-cover"
                    />
                  ) : (
                    job.company.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                    {job.company}
                  </h3>
                  <span className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {job.location}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Kategori:</span>
                  <span className="font-bold text-slate-800">{job.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tipe Kerja:</span>
                  <span className="font-bold text-slate-800">{job.workType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Sistem Kerja:</span>
                  <span className="font-bold text-slate-800">{job.workSetup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pengalaman:</span>
                  <span className="font-bold text-slate-800">{job.experienceLevel}</span>
                </div>
              </div>

              {job.relevantTrainingPrograms.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 space-y-1 text-xs">
                  <span className="font-black text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kurikulum Pelatihan STP:</span>
                  </span>
                  <p className="text-amber-800 text-xs font-semibold leading-snug">
                    {job.relevantTrainingPrograms.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Card Checklist Dokumen Pelamar */}
            <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Dokumen yang Perlu Disiapkan</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Curriculum Vitae (CV) terbaru format PDF (*ATS-friendly*)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sertifikat Pelatihan / Uji Kompetensi Solo Technopark</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Portofolio proyek teknis atau tautan GitHub/LinkedIn</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Salinan Ijazah atau Surat Keterangan Lulus (SKL)</span>
                </li>
              </ul>
            </div>

            {/* Bantuan & Tanya Tim Hubungan Industri */}
            <div className="p-5 rounded-3xl bg-slate-100/80 border border-slate-200 text-xs space-y-2.5">
              <span className="font-black text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Butuh Bantuan Pelamaran?</span>
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Jika mengalami kendala kontak dengan perusahaan atau butuh bimbingan review CV, kunjungi forum karir alumni STP.
              </p>
              <Link href="/alumni-portal?channel=sapa-industri-dan-rekrutmen" className="block pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-bold border-slate-300 text-slate-800 hover:bg-white"
                >
                  <span>Buka Forum Diskusi Karir</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
