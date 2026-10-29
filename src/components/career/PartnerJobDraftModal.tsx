// src/components/career/PartnerJobDraftModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Briefcase, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  JobCategory,
  JobWorkType,
  JobWorkSetup,
  JobExperienceLevel,
} from '@/types/job.types';
import { usePartnerMutations } from '@/hooks/usePartners';
import { toast } from 'sonner';

interface PartnerJobDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderType: 'PARTNER' | 'TENANT';
  entityId: string;
  companyName: string;
  companyLogo?: string;
  defaultLocation?: string;
  defaultEmail?: string;
}

const CATEGORIES: JobCategory[] = [
  'IT & Rekayasa Perangkat Lunak',
  'Kecerdasan Buatan & Sains Data',
  'Keamanan Siber (Cyber Security)',
  'Multimedia, Game & Animasi 3D',
  'Manufaktur Presisi & Mekatronika',
  'Pemasaran & Bisnis Digital',
];

const WORK_TYPES: JobWorkType[] = [
  'Full-time',
  'Internship / Magang',
  'Contract',
  'Freelance / Project',
  'Part-time',
];

const WORK_SETUPS: JobWorkSetup[] = [
  'On-site (Solo Technopark)',
  'On-site',
  'Hybrid',
  'Remote / WFH',
];

const EXP_LEVELS: JobExperienceLevel[] = [
  'Fresh Graduate / Alumni Pelatihan',
  'Junior (0-2 Tahun)',
  'Mid-Level (2-4 Tahun)',
  'Senior (4+ Tahun)',
];

export default function PartnerJobDraftModal({
  isOpen,
  onClose,
  senderType,
  entityId,
  companyName,
  companyLogo,
  defaultLocation = 'Surakarta, Jawa Tengah',
  defaultEmail = '',
}: PartnerJobDraftModalProps) {
  const { submitJobDraftMutation } = usePartnerMutations();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<JobCategory>('IT & Rekayasa Perangkat Lunak');
  const [workType, setWorkType] = useState<JobWorkType>(
    senderType === 'TENANT' ? 'Internship / Magang' : 'Full-time'
  );
  const [workSetup, setWorkSetup] = useState<JobWorkSetup>(
    senderType === 'TENANT' ? 'On-site (Solo Technopark)' : 'On-site'
  );
  const [experienceLevel, setExperienceLevel] = useState<JobExperienceLevel>(
    'Fresh Graduate / Alumni Pelatihan'
  );
  const [location, setLocation] = useState(defaultLocation);
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [skillsInput, setSkillsInput] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [applicationEmail, setApplicationEmail] = useState(defaultEmail);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await submitJobDraftMutation.mutateAsync({
        title: title.trim(),
        company: companyName,
        companyLogo: companyLogo || '',
        companyType:
          senderType === 'TENANT' ? 'Tenant Inkubasi Startup STP' : 'Mitra Industri STP',
        category,
        location: location.trim() || 'Surakarta, Jawa Tengah',
        city: 'Surakarta',
        workType,
        workSetup,
        experienceLevel,
        salary: {
          min: salaryMin ? Number(salaryMin) : undefined,
          max: salaryMax ? Number(salaryMax) : undefined,
          currency: 'IDR',
          period: 'Bulan',
          isNegotiable: true,
          isDisclosed: Boolean(salaryMin || salaryMax),
        },
        description: description.trim(),
        skills,
        applicationUrl: applicationUrl.trim() || undefined,
        applicationEmail: applicationEmail.trim() || undefined,
        isStpPartner: true,
        ...(senderType === 'PARTNER' ? { partnerId: entityId } : { tenantId: entityId }),
      });

      toast.success(
        'Pengajuan lowongan berhasil dikirim! Tim Admin Bursa Karir STP akan memverifikasi dan menayangkannya segera.'
      );
      setTitle('');
      setSkillsInput('');
      setDescription('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengajukan lowongan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-6 my-auto space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {senderType === 'TENANT' ? 'Kebutuhan Talenta Startup Tenant' : 'Publikasi Lowongan Mitra Resmi'}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              Ajukan Lowongan / Magang — {companyName}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Diprioritaskan untuk lulusan Vokasi Solo Technopark & RSKB Surakarta.
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

        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-2 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-[11px] sm:text-xs">
            Lowongan Anda diverifikasi cepat oleh Tim Karir STP sebelum ditayangkan ke bursa publik.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Judul Posisi / Kebutuhan Talenta *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Fullstack Web Developer / Operator Mesin CNC"
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Bidang Keahlian *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as JobCategory)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Tipe Ikatan Kerja</label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value as JobWorkType)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Sistem Kerja</label>
            <select
              value={workSetup}
              onChange={(e) => setWorkSetup(e.target.value as JobWorkSetup)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              {WORK_SETUPS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Level Pengalaman</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as JobExperienceLevel)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              {EXP_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Lokasi Penempatan</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Gaji Min</label>
              <Input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Opsional (Rp)"
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Gaji Maks</label>
              <Input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Opsional (Rp)"
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Keahlian Utama (pisahkan dengan koma) *</label>
            <Input
              required
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Contoh: React, TypeScript, Tailwind CSS, Git"
              className="h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Email Penerima Lamaran</label>
            <Input
              type="email"
              value={applicationEmail}
              onChange={(e) => setApplicationEmail(e.target.value)}
              placeholder="hrd@perusahaan.co.id"
              className="h-9 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Tautan Form Rekrutmen (Opsional)</label>
            <Input
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://..."
              className="h-9 rounded-xl text-xs"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-700">Deskripsi Pekerjaan & Kualifikasi *</label>
            <Textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tanggung jawab utama, kualifikasi teknis, serta benefit..."
              className="rounded-xl text-xs sm:text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-semibold h-8.5">
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={submitJobDraftMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-8.5"
          >
            {submitJobDraftMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Briefcase className="w-3.5 h-3.5" />
            )}
            <span>Kirim untuk Verifikasi STP</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

