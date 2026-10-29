// src/components/career/JobQuickApplyModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, Send, ShieldCheck, ExternalLink, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { JobListing } from '@/types/job.types';
import { Alumni } from '@/types/ecosystem.types';
import { useForumMutations } from '@/hooks/useAlumniForum';
import { toast } from 'sonner';

interface JobQuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobListing;
  applicantUid: string;
  applicantEmailDefault: string;
  alumniProfile?: Alumni | null;
  aiMatchScore?: number;
}

export default function JobQuickApplyModal({
  isOpen,
  onClose,
  job,
  applicantUid,
  applicantEmailDefault,
  alumniProfile,
  aiMatchScore,
}: JobQuickApplyModalProps) {
  const { submitJobApplicationMutation } = useForumMutations();

  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [programTaken, setProgramTaken] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setApplicantName(alumniProfile?.name || '');
    setApplicantEmail(alumniProfile?.email || applicantEmailDefault || '');
    setApplicantPhone(alumniProfile?.phone || '');
    setProgramTaken(alumniProfile?.programTaken || '');
    setResumeUrl(alumniProfile?.resumeUrl || '');
    setPortfolioUrl(alumniProfile?.portfolioUrl || '');
    setCoverNote(
      `Yth. Tim Rekrutmen ${job.company}, saya lulusan terverifikasi ${
        alumniProfile?.programTaken || 'Vokasi Solo Technopark / RSKB Surakarta'
      } bermaksud melamar posisi ${job.title}. Berikut terlampir profil kompetensi dan portofolio saya.`
    );
  }, [isOpen, alumniProfile, applicantEmailDefault, job]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitJobApplicationMutation.mutateAsync({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company,
      partnerId: job.partnerId,
      tenantId: job.tenantId,
      applicantUid,
      alumniId: alumniProfile?.id,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantPhone: applicantPhone.trim() || undefined,
      originSource: alumniProfile?.originSource || 'STP_VOKASI',
      programTaken: programTaken.trim() || undefined,
      skills: alumniProfile?.skills || job.skills.slice(0, 4),
      resumeUrl: resumeUrl.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      coverNote: coverNote.trim() || undefined,
      aiMatchScore,
      forumReputationScore: alumniProfile?.forumReputationScore || 0,
    });

    if (res.success) {
      toast.success(
        'Lamaran terverifikasi berhasil dikirim! Pantau progres wawancara Anda di halaman Profil.'
      );
      onClose();
    } else {
      toast.error(res.error || 'Gagal mengirim lamaran terverifikasi.');
    }
  };

  return (
    <div className="workspace-page-container py-2 sm:py-4">
      <div className="workspace-header mb-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors"
        >
          ← Kembali ke Rincian Lowongan
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="workspace-card w-full p-5 sm:p-8 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Lamaran Terverifikasi 1-Klik STP × RSKB
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {job.title} — {job.company}
            </h3>
            <p className="text-xs text-slate-500">
              Lamaran Anda langsung masuk ke Dashboard HRD Mitra / Startup Tenant & Tracer Study STP.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Reputasi & AI Match yang Ikut Terlampir */}
        {((alumniProfile?.forumReputationScore || 0) > 0 || (aiMatchScore && aiMatchScore > 0)) && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            {(alumniProfile?.forumReputationScore || 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                +{alumniProfile?.forumReputationScore} Poin Kompetensi Forum Terlampir
              </span>
            )}
            {aiMatchScore && aiMatchScore > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Skor Clario AI {aiMatchScore}% Terlampir
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap *</label>
            <Input
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Aktif *</label>
            <Input
              required
              type="email"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nomor WhatsApp</label>
            <Input
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              placeholder="0812..."
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Program Diklat STP / RSKB</label>
            <Input
              value={programTaken}
              onChange={(e) => setProgramTaken(e.target.value)}
              placeholder="Contoh: CNC Milling / RSKB Digital"
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tautan CV / Sertifikat (URL)</label>
            <Input
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tautan Portofolio / GitHub</label>
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="h-10 rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Pesan Pengantar Singkat ke HRD</label>
          <Textarea
            rows={3}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {job.applicationUrl ? (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Buka juga Portal Eksternal <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitJobApplicationMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submitJobApplicationMutation.isPending
                  ? 'Mengirim Lamaran...'
                  : 'Kirim Lamaran Terverifikasi'}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

