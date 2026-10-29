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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-6 my-auto space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3" />
              Lamaran 1-Klik STP × RSKB
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              {job.title} — {job.company}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Langsung terhubung ke HRD Perusahaan & Tracer Study STP.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Reputasi & AI Match yang Ikut Terlampir */}
        {((alumniProfile?.forumReputationScore || 0) > 0 || (aiMatchScore && aiMatchScore > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
            {(alumniProfile?.forumReputationScore || 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
                <Award className="w-3 h-3 text-amber-600" />
                +{alumniProfile?.forumReputationScore} Poin Forum
              </span>
            )}
            {aiMatchScore && aiMatchScore > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-[11px]">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Match AI {aiMatchScore}%
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Nama Lengkap *</label>
            <Input
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Email Aktif *</label>
            <Input
              required
              type="email"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Nomor WhatsApp</label>
            <Input
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              placeholder="0812..."
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Program Diklat STP / RSKB</label>
            <Input
              value={programTaken}
              onChange={(e) => setProgramTaken(e.target.value)}
              placeholder="Contoh: CNC Milling / RSKB Digital"
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Tautan CV / Sertifikat (URL)</label>
            <Input
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Tautan Portofolio / GitHub</label>
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Pesan Pengantar Singkat ke HRD</label>
          <Textarea
            rows={2}
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            className="rounded-xl text-xs sm:text-sm resize-none"
            placeholder="Jelaskan ringkas minat & kesiapan Anda..."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {job.applicationUrl ? (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Portal Eksternal <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8.5 rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitJobApplicationMutation.isPending}
              className="h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>
                {submitJobApplicationMutation.isPending
                  ? 'Mengirim...'
                  : 'Kirim Lamaran'}
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

