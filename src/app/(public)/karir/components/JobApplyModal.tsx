// src/app/(public)/karir/components/JobApplyModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
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
  X,
  Copy,
  Check,
  Phone,
  BookmarkCheck,
  Search,
  MessageSquare,
  Linkedin,
  Info,
  ArrowUpRight,
} from 'lucide-react';
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
} from '@/utils/jobContactUtils';
import { toast } from 'sonner';

interface JobApplyModalProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAiMatch?: (job: JobListing) => void;
}

export default function JobApplyModal({
  job,
  isOpen,
  onClose,
  onOpenAiMatch,
}: JobApplyModalProps) {
  const { user } = useAuth();
  const submitAppMutation = useSubmitJobApplication();
  const markExternalMutation = useMarkExternalJobApplied();
  const { data: myApps = [] } = useMyJobApplications();

  // Mode tab: 'official_channels' (Saluran Lamar Resmi & Kontak HRD) | 'stp_recommendation' (Bantuan Pendampingan STP)
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
      setIsSubmittedSuccess(false);
      // Selalu mulai di tab saluran resmi agar pengguna langsung dapat link/kontak
      setActiveTab('official_channels');
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const linkedInUrl = getLinkedInJobsUrl(job);
  const googleJobsUrl = getGoogleJobsUrl(job);
  const jobstreetUrl = getJobstreetSearchUrl(job);
  const glintsUrl = getGlintsSearchUrl(job);
  const portalDomain = extractDomain(job.applicationUrl);

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
        portfolioUrl: portfolioUrl.trim() || undefined,
        programTaken: selectedProgram.trim() || undefined,
        coverNote: coverNote.trim() || undefined,
        skills: job.skills || [],
        partnerId: job.partnerId,
        tenantId: job.tenantId,
      });

      setIsSubmittedSuccess(true);
    } catch {
      // Error ditangani oleh mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* ─── Modal Header ─── */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Penyaluran Karir Terverifikasi Solo Technopark
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {job.workType} • {job.workSetup}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span className="font-semibold text-emerald-300">{job.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {job.location}
              </span>
            </div>
          </div>

          {/* ─── Tab Navigasi Mode Pelamaran ─── */}
          <div className="flex gap-2 mt-4 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('official_channels')}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'official_channels'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Saluran Lamar Resmi & Kontak</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stp_recommendation')}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'stp_recommendation'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bantuan Rekomendasi STP</span>
            </button>
          </div>
        </div>

        {/* ─── Modal Body Content ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Layar Sukses Jika Berkas Berhasil Dikirim / Ditandai */}
          {isSubmittedSuccess ? (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200/90 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-emerald-950">
                  Lamaran Berhasil Dicatat!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Posisi <strong className="text-emerald-950">{job.title}</strong> di{' '}
                  <strong className="text-emerald-950">{job.company}</strong> telah resmi masuk ke{' '}
                  <strong>Daftar Lamaran Saya</strong>. Anda dapat memantau status lamaran kapan saja.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 border-blue-300 text-blue-900 hover:bg-blue-100 font-bold text-xs rounded-xl gap-2"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Buka LinkedIn Jobs</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </a>

                {job.applicationUrl && (
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto h-10 border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold text-xs rounded-xl gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Buka Portal Karir Perusahaan</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}

                <Button
                  onClick={onClose}
                  className="w-full sm:w-auto h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs"
                >
                  Selesai & Tutup
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ─── TAB 1: SALURAN LAMAR RESMI & KONTAK HRD (DEFAULT) ─── */}
              {activeTab === 'official_channels' && (
                <div className="space-y-5">
                  {hasApplied && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-900">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Lowongan ini sudah tercatat di Daftar Lamaran Saya ({existingApp?.statusNote || 'Tercatat'}).</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Tersimpan</Badge>
                    </div>
                  )}

                  {/* Section A: Akses Resmi Pelamaran */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>Akses Resmi Pelamaran (Klik Langsung):</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">Pilih tautan resmi di bawah</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* 1. Tautan LinkedIn Jobs */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Linkedin className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                              Lamar via LinkedIn Jobs Resmi
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                              Terverifikasi
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 pl-8">
                            Buka pencarian postingan resmi posisi <strong>{job.title}</strong> di {job.company} untuk melamar langsung via LinkedIn.
                          </p>
                        </div>

                        <a
                          href={linkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto shrink-0 pl-8 sm:pl-0"
                          onClick={() => handleMarkExternalApplied('LinkedIn Jobs')}
                        >
                          <Button className="w-full sm:w-auto h-9 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-xs">
                            <span>Buka LinkedIn Jobs</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      </div>

                      {/* 2. Portal Karir Perusahaan / ATS (Jika Ada) */}
                      {job.applicationUrl && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Globe className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors">
                                Portal Karir Resmi Perusahaan {portalDomain ? `(${portalDomain})` : ''}
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                ATS / Karir
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 pl-8">
                              Tautan langsung formulir pelamaran resmi dari sistem rekrutmen {job.company}.
                            </p>
                          </div>

                          <a
                            href={job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto shrink-0 pl-8 sm:pl-0"
                            onClick={() => handleMarkExternalApplied(portalDomain || 'Portal Resmi Perusahaan')}
                          >
                            <Button className="w-full sm:w-auto h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-xs">
                              <span>Buka Portal Karir</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B: Kontak Resmi HRD & Rekruter */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-teal-600" />
                      <span>Kontak Resmi Rekruter & HRD:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email HRD */}
                      {job.applicationEmail ? (
                        <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex flex-col justify-between gap-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                              Email Resmi HRD
                            </span>
                            <span className="font-extrabold text-xs text-teal-950 block truncate mt-0.5" title={job.applicationEmail}>
                              {job.applicationEmail}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {mailtoLink && (
                              <a
                                href={mailtoLink}
                                className="flex-1"
                                onClick={() => handleMarkExternalApplied('Email HRD')}
                              >
                                <Button
                                  size="sm"
                                  className="w-full h-8 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg gap-1 shadow-xs"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Kirim Email</span>
                                </Button>
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyEmail}
                              className="h-8 px-2.5 text-[11px] font-semibold border-teal-300 text-teal-900 hover:bg-teal-100 rounded-lg shrink-0"
                            >
                              {hasCopiedEmail ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Email Rekrutmen
                          </span>
                          <span className="text-xs text-slate-600">
                            Pelamaran diproses via portal resmi online / LinkedIn di atas.
                          </span>
                        </div>
                      )}

                      {/* Telepon / WhatsApp HRD */}
                      {contactPhone ? (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between gap-2.5">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                              WhatsApp / Telepon HRD
                            </span>
                            <span className="font-extrabold text-xs text-emerald-950 block truncate mt-0.5">
                              {contactPhone}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1"
                                onClick={() => handleMarkExternalApplied('WhatsApp HRD')}
                              >
                                <Button
                                  size="sm"
                                  className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg gap-1 shadow-xs"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Chat WhatsApp</span>
                                </Button>
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyPhone}
                              className="h-8 px-2.5 text-[11px] font-semibold border-emerald-300 text-emerald-900 hover:bg-emerald-100 rounded-lg shrink-0"
                            >
                              {hasCopiedPhone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kontak Rekruter Langsung
                          </span>
                          <span className="text-xs text-slate-600">
                            Tersedia melalui pesan InMail LinkedIn atau tab Bantuan Rekomendasi STP.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section C: Pencarian Cepat Alternatif (Fallback jika Link Kadaluarsa) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pencarian Cepat di Portal Lain (Alternatif):</span>
                      </span>
                      <span className="text-[10px] text-slate-400">1-Click Smart Search</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <a
                        href={googleJobsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors shadow-2xs"
                      >
                        <Search className="w-3 h-3 text-red-500" />
                        <span>Google Jobs</span>
                        <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                      </a>

                      <a
                        href={jobstreetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors shadow-2xs"
                      >
                        <Globe className="w-3 h-3 text-purple-600" />
                        <span>JobStreet</span>
                        <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                      </a>

                      <a
                        href={glintsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors shadow-2xs"
                      >
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Glints</span>
                        <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    </div>
                  </div>

                  {/* Section D: Tracking Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500">
                      💡 Setelah melamar di portal luar, simpan ke riwayat Anda dengan tombol ini.
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMarkExternalApplied(portalDomain || 'Portal Resmi')}
                      disabled={markExternalMutation.isPending || hasApplied}
                      className="w-full sm:w-auto h-10 px-4 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl gap-2"
                    >
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span>{hasApplied ? 'Sudah Ada di Daftar Lamaran' : 'Tandai Saya Sudah Melamar'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: FORM BANTUAN REKOMENDASI KARIR STP (OPSIONAL) ─── */}
              {activeTab === 'stp_recommendation' && (
                <form onSubmit={handleSubmitStpApplication} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-950">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Bantuan Rekomendasi Terverifikasi Solo Technopark</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-emerald-800">
                      Gunakan formulir ini jika Anda ingin berkas dan riwayat pelatihan Anda di Solo Technopark didampingi dan diajukan oleh Tim Penyaluran Kerja STP langsung ke HRD mitra industri.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Contoh: Budi Prasetyo"
                        className="h-10 text-xs rounded-xl border-slate-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Alamat Email Aktif <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="h-10 text-xs rounded-xl border-slate-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Nomor WhatsApp / HP</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Wajib untuk Undangan</span>
                      </label>
                      <Input
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="081234567890"
                        className="h-10 text-xs rounded-xl border-slate-200"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tautan CV / Resume / LinkedIn
                      </label>
                      <Input
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://drive.google.com/... atau linkedin.com/in/..."
                        className="h-10 text-xs rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  {job.relevantTrainingPrograms && job.relevantTrainingPrograms.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Program Pelatihan STP yang Pernah Diikuti
                      </label>
                      <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white"
                      >
                        <option value="">-- Pilih Program Pelatihan STP --</option>
                        {job.relevantTrainingPrograms.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="Pelatihan Mandiri STP Lainnya">
                          Pelatihan Mandiri STP Lainnya
                        </option>
                        <option value="Alumni RSKB Surakarta">Alumni RSKB Surakarta</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan Singkat untuk Rekruter (Cover Note / Perkenalan)
                    </label>
                    <Textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Jelaskan ringkas keahlian utama, sertifikat diklat, dan kesiapan Anda bergabung..."
                      className="text-xs rounded-xl border-slate-200 resize-none h-20"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('official_channels')}
                      className="h-11 px-4 text-xs font-bold rounded-xl"
                    >
                      Kembali ke Saluran Resmi
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitAppMutation.isPending}
                      className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md gap-2 flex-1 sm:flex-initial"
                    >
                      {submitAppMutation.isPending ? (
                        <span>Mengirim Berkas...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Berkas Rekomendasi STP</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
