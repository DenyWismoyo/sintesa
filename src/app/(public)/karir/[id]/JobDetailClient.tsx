// src/app/(public)/karir/[id]/JobDetailClient.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Share2,
  Send,
  Loader2,
  Award,
  Zap,
  ArrowLeft,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Bookmark,
  FileText,
  PhoneCall,
  Check,
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useJobDetail, useJobs, useJobAiMatchMutation } from '@/hooks/useJobs';
import { JobListing, JobAiMatchResponse } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import JobShareMenu from '../components/JobShareMenu';
import CareerExclusiveGate from '@/components/career/CareerExclusiveGate';
import { useAuth } from '@/lib/AuthContext';
import { canAccessCareer } from '@/config/roles';

interface JobDetailClientProps {
  idOrSlug: string;
}

const COMMON_STP_PROGRAMS = [
  'Diklat Underwater Wet Welding (Pengelasan Bawah Air) Solo Technopark',
  'Sertifikasi Juru Las (Welder) 6G Standar Migas & Marine',
  'Pelatihan Operator Mesin CNC Milling & Bubut 5-Axis',
  'Bootcamp Software Quality Assurance',
  'Pelatihan Fullstack Web Development',
  'Bootcamp Artificial Intelligence & Deep Learning',
  'Pelatihan Data Science & Machine Learning',
  'Pelatihan Cyber Security Defense & Ethical Hacking',
  'Pelatihan IoT & Smart Embedded Systems',
  'Bootcamp Pengembangan Game & Animasi 3D',
  'Pelatihan Pemasaran Digital & E-Commerce',
  'Pelatihan Teknisi Otomasi Industri & Mekatronika',
  'Umum / Program Pelatihan Lainnya',
];

export default function JobDetailClient({ idOrSlug }: JobDetailClientProps) {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const hasCareerAccess = canAccessCareer(role);
  const { data: job, isLoading, isError } = useJobDetail(idOrSlug, { enabled: hasCareerAccess });

  const [imgError, setImgError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // State untuk form AI Matcher di halaman
  const [alumniName, setAlumniName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [alumniSkillsInput, setAlumniSkillsInput] = useState('');
  const [alumniExperience, setAlumniExperience] = useState('');
  const [aiMatchResult, setAiMatchResult] = useState<JobAiMatchResponse | null>(null);

  const matchMutation = useJobAiMatchMutation();

  // Lowongan terkait (kategori yang sama)
  const { data: relatedData } = useJobs({
    category: job?.category,
  });

  const relatedJobs = React.useMemo(() => {
    if (!relatedData?.jobs || !job) return [];
    return relatedData.jobs.filter((j) => j.id !== job.id).slice(0, 3);
  }, [relatedData, job]);

  // Set default skills & program dari data job ketika selesai load
  React.useEffect(() => {
    if (job) {
      if (job.relevantTrainingPrograms.length > 0) {
        setSelectedProgram(job.relevantTrainingPrograms[0]);
      } else {
        setSelectedProgram(COMMON_STP_PROGRAMS[0]);
      }
      setAlumniSkillsInput(job.skills.slice(0, 4).join(', '));
    }
  }, [job]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Tautan lowongan berhasil disalin ke clipboard!');
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    if (!isBookmarked) {
      toast.success('Lowongan disimpan ke daftar simpanan Anda.');
    } else {
      toast.info('Lowongan dihapus dari simpanan.');
    }
  };

  const handleRunAiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    const skillsArray = alumniSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const result = await matchMutation.mutateAsync({
        jobId: job.id,
        alumniName: alumniName.trim() || undefined,
        alumniProgram: selectedProgram || undefined,
        alumniSkills: skillsArray,
        alumniExperience: alumniExperience.trim() || undefined,
      });
      setAiMatchResult(result);
      toast.success('Analisis kesesuaian Clario AI berhasil dihitung!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menjalankan analisis AI Matcher.');
    }
  };

  const formattedSalary = () => {
    if (!job || !job.salary.isDisclosed) return 'Gaji Kompetitif (Dirahasiakan)';
    const curr = job.salary.currency || 'IDR';
    if (job.salary.min && job.salary.max) {
      return `${formatSalary(job.salary.min, curr)} - ${formatSalary(job.salary.max, curr)} / ${job.salary.period}`;
    }
    if (job.salary.min) return `Mulai ${formatSalary(job.salary.min, curr)} / ${job.salary.period}`;
    if (job.salary.max) return `Hingga ${formatSalary(job.salary.max, curr)} / ${job.salary.period}`;
    return 'Gaji Negosiabel';
  };

  if (authLoading) {
    return (
      <SectionContainer accent="emerald" width="default">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Memverifikasi hak akses pengguna...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!hasCareerAccess) {
    return (
      <SectionContainer accent="emerald" width="default">
        <CareerExclusiveGate jobTitle={job?.title} companyName={job?.company} />
      </SectionContainer>
    );
  }

  if (isLoading) {
    return (
      <SectionContainer accent="emerald" width="default">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Memuat rincian lengkap pekerjaan...</p>
        </div>
      </SectionContainer>
    );
  }

  if (isError || !job) {
    return (
      <SectionContainer accent="emerald" width="default">
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 mt-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lowongan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Lowongan pekerjaan yang Anda cari mungkin sudah ditutup, kedaluwarsa, atau tautan yang Anda buka tidak valid.
          </p>
          <Button
            onClick={() => router.push('/karir')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Bursa Karir</span>
          </Button>
        </div>
      </SectionContainer>
    );
  }

  const getCompanyBadge = () => {
    if (job.source === 'jsearch_realtime') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          Live Realtime ({job.applySource || 'JSearch RapidAPI'})
        </span>
      );
    }

    switch (job.companyType) {
      case 'Mitra Industri STP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Mitra Industri Resmi Solo Technopark
          </span>
        );
      case 'Tenant Inkubasi Startup STP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Tenant Inkubasi Startup STP
          </span>
        );
      case 'BUMN & Pemerintah':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            BUMN / Instansi Pemerintah
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Perusahaan Industri
          </span>
        );
    }
  };

  return (
    <SectionContainer accent="emerald" width="default" className="pt-2 sm:pt-4 pb-16">
      {/* ─── Breadcrumb & Back Navigation ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/karir" className="hover:text-emerald-600 transition-colors">
            Bursa Karir
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs">
            {job.title}
          </span>
        </nav>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/karir')}
          className="h-8.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl border-slate-200 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Lowongan</span>
        </Button>
      </div>

      {/* ─── Main Hero Card Lowongan ─── */}
      <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Logo & Info Perusahaan */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200/90 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
              {job.companyLogo && !imgError ? (
                <Image
                  src={job.companyLogo}
                  alt={job.company}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setImgError(true)}
                  unoptimized
                />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {getCompanyBadge()}
                <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200">
                  {job.category}
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  {job.experienceLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (Share & Bookmark) */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleBookmark}
              className={`h-10 px-3.5 text-xs font-semibold rounded-xl border-slate-200 gap-1.5 ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
            </Button>

            <JobShareMenu job={job} variant="button" />

            {/* Quick jump to application */}
            {job.applicationUrl ? (
              <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                <Button className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-xs">
                  <span>Lamar Sekarang</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            ) : job.applicationEmail ? (
              <a
                href={`mailto:${job.applicationEmail}?subject=Lamaran Pekerjaan: ${encodeURIComponent(
                  job.title
                )} - Alumni Solo Technopark`}
              >
                <Button className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Email</span>
                </Button>
              </a>
            ) : null}
          </div>
        </div>

        {/* Feature Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Tipe Pekerjaan</span>
            <span className="font-extrabold text-slate-800">{job.workType}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Pengaturan Kerja</span>
            <span className="font-extrabold text-slate-800">{job.workSetup}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Pengalaman</span>
            <span className="font-extrabold text-slate-800">{job.experienceLevel}</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-600 block mb-0.5">Estimasi Gaji ({job.salary.period})</span>
            <span className="font-extrabold text-emerald-800">{formattedSalary()}</span>
          </div>
        </div>
      </div>

      {/* ─── Layout 2 Kolom (Konten Detail + Sidebar Lamar) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── Kolom Kiri: Rincian Lengkap (8 Kolom) ─── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Banner Kurikulum Selaras Solo Technopark */}
          {job.relevantTrainingPrograms.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-white border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm sm:text-base">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span>Kurikulum Selaras Program Diklat Solo Technopark</span>
                </div>
                <Link href="/program-pelatihan">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-bold text-amber-800 hover:text-amber-950 hover:bg-amber-100/60 gap-1 rounded-lg"
                  >
                    <span>Daftar Diklat</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                Posisi ini memiliki kesesuaian kurikulum teknis langsung dengan materi vokasi yang diajarkan pada program:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {job.relevantTrainingPrograms.map((prog) => (
                  <span
                    key={prog}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white text-amber-900 border border-amber-200 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    {prog}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 1. Deskripsi Lengkap Pekerjaan */}
          <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span className="w-2 h-5 bg-emerald-600 rounded-full" />
              Deskripsi Lengkap Pekerjaan
            </h2>
            <div className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-3">
              {job.description}
            </div>
          </div>

          {/* 2. Tanggung Jawab Utama */}
          {job.responsibilities.length > 0 && (
            <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                Tanggung Jawab Utama
              </h2>
              <ul className="space-y-2.5 list-none pl-0">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Kualifikasi & Persyaratan */}
          {job.requirements.length > 0 && (
            <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                Kualifikasi & Persyaratan
              </h2>
              <ul className="space-y-2.5 list-none pl-0">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Keahlian & Tools yang Dibutuhkan */}
          <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
              <span className="w-2 h-5 bg-emerald-600 rounded-full" />
              Keahlian & Tools yang Dibutuhkan
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* 5. Benefit & Fasilitas Kerja */}
          {job.benefits.length > 0 && (
            <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                <span className="w-2 h-5 bg-emerald-600 rounded-full" />
                Benefit & Fasilitas Kerja
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-xs sm:text-sm text-slate-700"
                  >
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Section Terintegrasi: Clario AI Talent Matcher (Alumni Solo Technopark) */}
          <div id="ai-match" className="public-card bg-gradient-to-b from-indigo-50/40 via-white to-white rounded-3xl border border-indigo-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Clario AI Talent Matcher</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  Uji Keselarasan Profil Anda untuk Posisi Ini
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gunakan kecerdasan buatan Clario AI untuk mengevaluasi seberapa siap profil dan keahlian Anda untuk posisi{' '}
                  <span className="font-bold text-slate-900">{job.title}</span> di{' '}
                  <span className="font-bold text-slate-900">{job.company}</span>. Dapatkan analisis kesenjangan skill dan rekomendasi persiapan wawancara secara instan!
                </p>
              </div>
            </div>

            <form onSubmit={handleRunAiMatch} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap Alumni
                  </label>
                  <input
                    type="text"
                    value={alumniName}
                    onChange={(e) => setAlumniName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Program Pelatihan STP yang Pernah Diambil
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {COMMON_STP_PROGRAMS.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Daftar Keahlian / Tools yang Dikuasai (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={alumniSkillsInput}
                  onChange={(e) => setAlumniSkillsInput(e.target.value)}
                  placeholder="Contoh: SMAW 6G, TIG Welding, NDT Testing, AutoCAD, Rigging"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Proyek Akhir Pelatihan / Pengalaman Kerja Terkait
                </label>
                <textarea
                  rows={2}
                  value={alumniExperience}
                  onChange={(e) => setAlumniExperience(e.target.value)}
                  placeholder="Contoh: Menyelesaikan uji sertifikasi juru las 6G dan proyek pengelasan pipa tekanan tinggi di Solo Technopark..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={matchMutation.isPending}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl gap-2 shadow-md shadow-indigo-100"
              >
                {matchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Clario AI sedang menganalisis kecocokan profil Anda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Hitung Keselarasan Profil Saya dengan Clario AI</span>
                  </>
                )}
              </Button>
            </form>

            {/* Hasil Analisis AI Matcher */}
            {aiMatchResult && (
              <div className="space-y-4 pt-4 border-t border-indigo-100 animate-in fade-in zoom-in-95 duration-200">
                {/* Score Banner */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 font-black text-2xl">
                      {aiMatchResult.matchScore}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base">Skor Keselarasan Profil</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            aiMatchResult.matchGrade === 'Sangat Cocok'
                              ? 'bg-emerald-500 text-white'
                              : aiMatchResult.matchGrade === 'Cocok'
                              ? 'bg-teal-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {aiMatchResult.matchGrade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Kesesuaian profil alumni dengan standar kualifikasi {job.company}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 sm:text-right">
                    <span className="block font-semibold">Engine Evaluasi</span>
                    <span className="text-indigo-300 font-mono">Clario DeepSeek Reasoner</span>
                  </div>
                </div>

                {/* Ringkasan Eksekutif AI */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-slate-900 block mb-1">Kesimpulan Kurasi AI:</span>
                  {aiMatchResult.executiveSummary}
                </div>

                {/* Grid Skill Matched & Missing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Keahlian yang Sudah Selaras ({aiMatchResult.matchedSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiMatchResult.matchedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Keahlian Perlu Diperkuat ({aiMatchResult.missingSkills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiMatchResult.missingSkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Saran Persiapan Interview */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Rekomendasi Persiapan Lamaran & Wawancara</span>
                  </div>
                  <ul className="space-y-1.5 list-none pl-0 text-xs text-indigo-950">
                    {aiMatchResult.recommendedPreparation.map((prep, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{prep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Bar Sosial & WhatsApp Broadcast Share */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Bantu Rekan / Komunitas Anda Menemukan Karir Ini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim informasi lowongan resmi ini dengan format pesan rapi ke grup WhatsApp atau LinkedIn Anda.
              </p>
            </div>
            <JobShareMenu job={job} variant="inline-bar" />
          </div>

          {/* 7. Lowongan Terkait */}
          {relatedJobs.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">
                  Lowongan Serupa di Bidang {job.category}
                </h3>
                <Link
                  href={`/karir?kategori=${encodeURIComponent(job.category)}`}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedJobs.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/karir/${rel.id}`}
                    className="public-card bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        {rel.workType} • {rel.location.split(',')[0]}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 line-clamp-2 transition-colors">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{rel.company}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700 text-[11px]">
                        {rel.salary.isDisclosed
                          ? `${formatSalary(rel.salary.min || 0, rel.salary.currency || 'IDR')}`
                          : 'Kompetitif'}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Kolom Kanan: Sticky Sidebar Lamar & Ringkasan (4 Kolom) ─── */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Card Aksi Utama Melamar */}
          <div className="public-card bg-white rounded-3xl border border-emerald-200/90 p-6 sm:p-7 shadow-sm space-y-5 ring-1 ring-emerald-500/10">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Estimasi Gaji ({job.salary.period})
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {formattedSalary()}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gaji disesuaikan dengan kualifikasi, pengalaman teknis, dan portofolio kandidat.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {job.applicationUrl ? (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl gap-2 shadow-md shadow-emerald-200">
                    <span>{job.applySource ? `Lamar via ${job.applySource}` : 'Lamar Pekerjaan Sekarang'}</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              ) : null}

              {job.applicationEmail ? (
                <a
                  href={`mailto:${job.applicationEmail}?subject=Lamaran Pekerjaan: ${encodeURIComponent(
                    job.title
                  )} - Alumni Solo Technopark`}
                  className="block w-full"
                >
                  <Button
                    variant={job.applicationUrl ? 'outline' : 'default'}
                    className={`w-full h-12 font-black text-sm rounded-2xl gap-2 ${
                      job.applicationUrl
                        ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Lamaran via Email</span>
                  </Button>
                </a>
              ) : null}

              {/* Tombol Coba Uji AI Matcher */}
              <a href="#ai-match" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-2xl gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cek Skor Kecocokan AI Anda</span>
                </Button>
              </a>
            </div>

            {/* Checklist Panduan Alumni */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <span className="font-extrabold text-slate-900 block">Panduan Lamaran Alumni STP:</span>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Lampirkan sertifikat kelulusan diklat resmi Solo Technopark.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sertakan link portofolio / capstone project jika ada.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pastikan data kontak (Nomor WhatsApp & Email) aktif.</span>
              </div>
            </div>
          </div>

          {/* Card Info Ringkasan Spesifikasi */}
          <div className="public-card bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs text-xs">
            <h3 className="font-black text-slate-900 text-sm">Spesifikasi Lowongan</h3>

            <div className="space-y-3 divide-y divide-slate-100">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Perusahaan</span>
                <span className="font-bold text-slate-800 text-right">{job.company}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Lokasi Penempatan</span>
                <span className="font-bold text-slate-800 text-right">{job.location}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Kategori Bidang</span>
                <span className="font-bold text-slate-800 text-right">{job.category}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Tipe Kontrak</span>
                <span className="font-bold text-slate-800 text-right">{job.workType}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Pengaturan Kerja</span>
                <span className="font-bold text-slate-800 text-right">{job.workSetup}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Pengalaman Minimal</span>
                <span className="font-bold text-slate-800 text-right">{job.experienceLevel}</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-500">Penyedia Informasi</span>
                <span className="font-bold text-slate-800 text-right">
                  {job.source === 'jsearch_realtime' ? 'JSearch RapidAPI' : 'Mitra Solo Technopark'}
                </span>
              </div>
            </div>
          </div>

          {/* Bantuan Layanan Karir Solo Technopark */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Butuh Rekomendasi Karir STP?</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Alumni pelatihan Solo Technopark dapat meminta surat verifikasi kompetensi dan rekomendasi langsung dari Divisi Penyaluran Kerja & Hubungan Industri.
            </p>
            <Link
              href="/hubungi-kami"
              className="inline-block pt-1 font-bold text-emerald-600 hover:text-emerald-700"
            >
              Hubungi Career Center STP →
            </Link>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
