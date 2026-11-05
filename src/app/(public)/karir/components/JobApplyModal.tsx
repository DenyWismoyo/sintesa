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
  FileText,
  Globe,
  Mail,
  Sparkles,
  AlertCircle,
  X,
  Copy,
  Check,
  GraduationCap,
  ArrowRight,
  Phone,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { JobListing } from '@/types/job.types';
import { useAuth } from '@/lib/AuthContext';
import { useSubmitJobApplication, useMarkExternalJobApplied } from '@/hooks/useJobApplications';
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

  // Mode tab: 'stp_recommendation' | 'direct_portal' | 'email_hr'
  const [activeTab, setActiveTab] = useState<'stp_recommendation' | 'direct_portal' | 'email_hr'>(
    'stp_recommendation'
  );

  // Form states untuk rekomendasi STP
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

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

      // Tentukan tab awal yang paling relevan
      if (job.applicationUrl && !job.applicationEmail) {
        setActiveTab('stp_recommendation');
      } else if (!job.applicationUrl && job.applicationEmail) {
        setActiveTab('email_hr');
      } else {
        setActiveTab('stp_recommendation');
      }
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleCopyEmail = () => {
    if (!job.applicationEmail) return;
    navigator.clipboard.writeText(job.applicationEmail);
    setHasCopiedEmail(true);
    toast.success('Alamat Email Berhasil Disalin!');
    setTimeout(() => setHasCopiedEmail(false), 2500);
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
        applicantUid: user?.uid,
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
    } catch (err) {
      // Error ditangani oleh mutation
    }
  };

  const handleMarkExternalApplied = async () => {
    await markExternalMutation.mutateAsync({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      source: job.applySource || 'Portal Resmi Perusahaan',
      applicationUrl: job.applicationUrl,
    });
    setIsSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* ─── Modal Header ─── */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white relative">
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
          <div className="flex gap-2 mt-4 pt-2 border-t border-white/10 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('stp_recommendation')}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'stp_recommendation'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rekomendasi Karir STP</span>
            </button>

            {job.applicationUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('direct_portal')}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'direct_portal'
                    ? 'bg-sky-400 text-slate-950 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Portal Karir Perusahaan</span>
              </button>
            )}

            {job.applicationEmail && (
              <button
                type="button"
                onClick={() => setActiveTab('email_hr')}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'email_hr'
                    ? 'bg-teal-400 text-slate-950 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Kirim Email HRD</span>
              </button>
            )}
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
                      <span>Buka Juga Portal Karir Perusahaan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}

                <Button
                  onClick={onClose}
                  className="w-full sm:w-auto h-10 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs"
                >
                  Selesai & Kembali
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ─── TAB 1: FORM REKOMENDASI KARIR RESMI SOLO TECHNOPARK ─── */}
              {activeTab === 'stp_recommendation' && (
                <form onSubmit={handleSubmitStpApplication} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-950">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Jalur Rekomendasi Terverifikasi Solo Technopark</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-emerald-800">
                      Berkas dan profil kompetensi Anda akan diproses oleh Divisi Penyaluran Kerja & Hubungan Industri Solo Technopark untuk diteruskan langsung ke rekruter dengan cap rekomendasi talenta terverifikasi.
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
                        Program Pelatihan STP yang Diambil (Kurikulum Selaras)
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
                      placeholder="Jelaskan ringkas keahlian utama, pengalaman proyek, dan kesiapan Anda bergabung..."
                      className="text-xs rounded-xl border-slate-200 resize-none h-20"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="h-11 px-4 text-xs font-bold rounded-xl"
                    >
                      Batal
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
                          <span>Kirim Berkas & Rekomendasi STP</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─── TAB 2: PANDUAN LAMAR DI PORTAL KARIR PERUSAHAAN ─── */}
              {activeTab === 'direct_portal' && job.applicationUrl && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200/80 space-y-2">
                    <div className="flex items-center gap-2 font-black text-sky-950 text-xs">
                      <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Pelamaran Langsung ke Portal Perusahaan</span>
                    </div>
                    <p className="text-xs text-sky-800 leading-relaxed">
                      Lowongan ini menerima pendaftaran pelamar melalui portal rekrutmen resmi atau sistem ATS:{' '}
                      <strong className="text-sky-950">{job.applySource || 'Situs Resmi Rekruter'}</strong>.
                    </p>
                  </div>

                  {/* Langkah demi langkah agar pelamar tidak bingung */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Langkah Melamar Mandiri:
                    </h4>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <span className="font-bold block text-slate-900">Buka Formulir Resmi</span>
                          <span className="text-slate-500 text-[11px]">
                            Klik tombol "Buka Halaman Karir Perusahaan" di bawah untuk membuka formulir pendaftaran di tab baru browser Anda.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div>
                          <span className="font-bold block text-slate-900">Isi Berkas di Situs Perusahaan</span>
                          <span className="text-slate-500 text-[11px]">
                            Lengkapi data diri dan unggah CV/Resume terbaru Anda di situs resmi tersebut.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div>
                          <span className="font-bold block text-slate-900">Tandai di Portal Solo Technopark</span>
                          <span className="text-slate-500 text-[11px]">
                            Setelah selesai melamar di situs luar, tekan tombol <strong>"Tandai Saya Sudah Melamar"</strong> di bawah agar lowongan ini otomatis tersimpan ke <strong>Daftar Lamaran Saya</strong> untuk dipantau.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1"
                    >
                      <Button className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-xs">
                        <span>Buka Halaman Karir Perusahaan</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMarkExternalApplied}
                      disabled={markExternalMutation.isPending}
                      className="w-full sm:w-auto h-11 px-5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl gap-2"
                    >
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tandai Saya Sudah Melamar</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: PANDUAN LAMAR VIA EMAIL HRD RESMI ─── */}
              {activeTab === 'email_hr' && job.applicationEmail && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 space-y-2">
                    <div className="flex items-center gap-2 font-black text-teal-950 text-xs">
                      <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Kirim Lamaran Langsung ke Email HRD</span>
                    </div>
                    <p className="text-xs text-teal-800 leading-relaxed">
                      Perusahaan ini menerima berkas pelamar secara langsung melalui alamat email resmi departemen rekrutmen.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Email Resmi Rekruter:
                      </span>
                      <span className="font-extrabold text-sm text-slate-900 truncate block">
                        {job.applicationEmail}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyEmail}
                      className="h-8 px-3 text-xs font-semibold rounded-xl gap-1.5 shrink-0"
                    >
                      {hasCopiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Email</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Template Email Siap Pakai */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <span className="font-extrabold text-slate-900 block">
                      Subjek & Format yang Disarankan:
                    </span>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 font-mono text-[11px] text-slate-800 select-all">
                      Lamaran Pekerjaan: {job.title} - {applicantName || '[Nama Anda]'} (Alumni Solo Technopark)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 <strong>Tips:</strong> Lampirkan CV terbaru dalam format PDF dan sertifikat diklat resmi Solo Technopark agar mendapat prioritas review dari HRD.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                    <a
                      href={`mailto:${job.applicationEmail}?subject=Lamaran Pekerjaan: ${encodeURIComponent(
                        job.title
                      )} - ${encodeURIComponent(
                        applicantName || 'Alumni Solo Technopark'
                      )}&body=Yth. HRD ${encodeURIComponent(
                        job.company
                      )},%0D%0A%0D%0ASaya bermaksud mengajukan lamaran untuk posisi ${encodeURIComponent(
                        job.title
                      )}...`}
                      className="w-full sm:flex-1"
                    >
                      <Button className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl gap-2 shadow-xs">
                        <Mail className="w-4 h-4" />
                        <span>Buka Aplikasi Email Anda</span>
                      </Button>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMarkExternalApplied}
                      disabled={markExternalMutation.isPending}
                      className="w-full sm:w-auto h-11 px-5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl gap-2"
                    >
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tandai Sudah Kirim Email</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

