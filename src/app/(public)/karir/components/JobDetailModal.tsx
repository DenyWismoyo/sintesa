// src/app/(public)/karir/components/JobDetailModal.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
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
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { JobListing, JobAiMatchResponse } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import { useJobAiMatchMutation } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface JobDetailModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'detail' | 'ai-match';
}

const COMMON_STP_PROGRAMS = [
  'Bootcamp Software Quality Assurance',
  'Pelatihan Fullstack Web Development',
  'Bootcamp Artificial Intelligence & Deep Learning',
  'Pelatihan Data Science & Machine Learning',
  'Pelatihan Pengoperasian & Pemrograman CNC',
  'Bootcamp Pengembangan Game & Animasi 3D',
  'Pelatihan Cyber Security Defense & Ethical Hacking',
  'Pelatihan IoT & Smart Embedded Systems',
  'Pelatihan Pemasaran Digital & E-Commerce',
  'Pelatihan Juru Las (Welder) 3G/4G/6G',
  'Pelatihan Teknisi Komputer & Jaringan',
  'Umum / Program Pelatihan Lainnya',
];

export default function JobDetailModal({
  job,
  isOpen,
  onClose,
  initialTab = 'detail',
}: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'detail' | 'ai-match'>(initialTab);
  const [modalImgError, setModalImgError] = useState(false);

  // State untuk form AI Matcher
  const [alumniName, setAlumniName] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(
    job?.relevantTrainingPrograms[0] || COMMON_STP_PROGRAMS[0]
  );
  const [alumniSkillsInput, setAlumniSkillsInput] = useState(
    job?.skills.slice(0, 3).join(', ') || ''
  );
  const [alumniExperience, setAlumniExperience] = useState('');
  const [aiMatchResult, setAiMatchResult] = useState<JobAiMatchResponse | null>(null);

  const matchMutation = useJobAiMatchMutation();

  if (!isOpen || !job) return null;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/karir?id=${job.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Tautan lowongan berhasil disalin ke clipboard!');
    }
  };

  const formattedSalary = () => {
    if (!job.salary.isDisclosed) return 'Gaji Kompetitif (Dirahasiakan)';
    const curr = job.salary.currency || 'IDR';
    if (job.salary.min && job.salary.max) {
      return `${formatSalary(job.salary.min, curr)} - ${formatSalary(job.salary.max, curr)} per ${job.salary.period}`;
    }
    if (job.salary.min) return `Mulai ${formatSalary(job.salary.min, curr)} per ${job.salary.period}`;
    if (job.salary.max) return `Hingga ${formatSalary(job.salary.max, curr)} per ${job.salary.period}`;
    return 'Gaji Negosiabel';
  };

  const handleRunAiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Analisis kesesuaian Clario AI selesai!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menjalankan analisis AI Matcher.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* ─── Header Modal ─── */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200 shadow-sm p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
              {job.companyLogo && !modalImgError ? (
                <Image
                  src={job.companyLogo}
                  alt={job.company}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setModalImgError(true)}
                  unoptimized
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {job.source === 'jsearch_realtime' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Live Realtime ({job.applySource || 'JSearch'})
                  </span>
                ) : job.isStpPartner ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Mitra Terverifikasi Solo Technopark
                  </span>
                ) : null}
                <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                  {job.workType}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                  {job.workSetup}
                </Badge>
              </div>

              <h2 className="font-extrabold text-base sm:text-xl text-slate-900 leading-snug">
                {job.title}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                <span className="font-bold text-slate-800">{job.company}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {job.location}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Salin Tautan Lowongan"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Tab Switcher ─── */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white flex items-center gap-2">
          <button
            onClick={() => setActiveTab('detail')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'detail'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Rincian Pekerjaan</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-match')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ai-match'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Clario AI Talent Matcher</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800 font-extrabold uppercase">
              Alumni
            </span>
          </button>
        </div>

        {/* ─── Body Modal ─── */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'detail' ? (
            <>
              {/* Highlight Box Pelatihan Selaras */}
              {job.relevantTrainingPrograms.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                      Direkomendasikan untuk Alumni Pelatihan Solo Technopark
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Lowongan ini memiliki korelasi silabus langsung dengan program:{' '}
                      <span className="font-semibold">{job.relevantTrainingPrograms.join(', ')}</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Deskripsi Pekerjaan */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                  Deskripsi Pekerjaan
                </h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Tanggung Jawab */}
              {job.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                    Tanggung Jawab Utama
                  </h4>
                  <ul className="space-y-1.5 list-none pl-0">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Persyaratan & Kualifikasi */}
              {job.requirements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                    Kualifikasi & Persyaratan
                  </h4>
                  <ul className="space-y-1.5 list-none pl-0">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keahlian & Tools yang Dibutuhkan */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                  Keahlian & Tools yang Dibutuhkan
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefit & Fasilitas */}
              {job.benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                    Benefit & Fasilitas Kerja
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-700"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ─── Tab Clario AI Talent Matcher ─── */
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-white border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Kecerdasan Buatan Clario AI untuk Alumni Solo Technopark</span>
                </div>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  Evaluasi seberapa siap profil dan keahlian Anda untuk posisi{' '}
                  <span className="font-bold text-indigo-950">{job.title}</span> di{' '}
                  <span className="font-bold text-indigo-950">{job.company}</span>. Dapatkan analisis kesenjangan skill dan rekomendasi persiapan wawancara secara instan!
                </p>
              </div>

              {/* Form Input AI Matcher */}
              <form onSubmit={handleRunAiMatch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Alumni
                    </label>
                    <input
                      type="text"
                      value={alumniName}
                      onChange={(e) => setAlumniName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Pelatihan STP yang Diambil
                    </label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Daftar Keahlian / Tools yang Dikuasai (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={alumniSkillsInput}
                    onChange={(e) => setAlumniSkillsInput(e.target.value)}
                    placeholder="Contoh: React, TypeScript, Git, Postman, Figma"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Proyek Akhir Pelatihan / Pengalaman Kerja
                  </label>
                  <textarea
                    rows={2}
                    value={alumniExperience}
                    onChange={(e) => setAlumniExperience(e.target.value)}
                    placeholder="Contoh: Menyelesaikan capstone project platform e-commerce katalog di Solo Technopark..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={matchMutation.isPending}
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl gap-2 shadow-md shadow-indigo-200"
                >
                  {matchMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Clario AI sedang menganalisis kecocokan profil...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Hitung Keselarasan Profil dengan AI</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Hasil Analisis AI Matcher */}
              {aiMatchResult && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                  {/* Score Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 font-extrabold text-xl">
                        {aiMatchResult.matchScore}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base">Skor Keselarasan</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <p className="text-xs text-slate-300 mt-0.5">
                          Kesesuaian profil alumni dengan kebutuhan {job.company}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 sm:text-right">
                      <span className="block font-semibold">Model Evaluasi</span>
                      <span className="text-[11px] text-indigo-300">Clario DeepSeek V4 Reasoner</span>
                    </div>
                  </div>

                  {/* Ringkasan Eksekutif */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Analisis Karir:</span>
                    {aiMatchResult.executiveSummary}
                  </div>

                  {/* Grid Skill Matched & Missing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Keahlian yang Sudah Selaras</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiMatchResult.matchedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Keahlian Perlu Dipelajari</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiMatchResult.missingSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Saran Persiapan Interview */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Rekomendasi Persiapan Lamaran & Wawancara</span>
                    </div>
                    <ul className="space-y-1 list-none pl-0 text-xs text-indigo-950">
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
          )}
        </div>

        {/* ─── Footer Modal: Action Buttons ─── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Rentang Gaji ({job.salary.period})
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700">
              {formattedSalary()}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial h-10 px-4 text-xs font-bold rounded-xl"
            >
              Tutup
            </Button>

            {job.applicationUrl ? (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial"
              >
                <Button className="w-full h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-sm">
                  <span>{job.applySource ? `Lamar via ${job.applySource}` : 'Lamar Sekarang'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            ) : job.applicationEmail ? (
              <a
                href={`mailto:${job.applicationEmail}?subject=Lamaran Pekerjaan: ${encodeURIComponent(
                  job.title
                )} - Alumni Solo Technopark`}
                className="flex-1 sm:flex-initial"
              >
                <Button className="w-full h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-sm">
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Email HR</span>
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
