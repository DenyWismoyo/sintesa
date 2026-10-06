// src/app/(public)/karir/components/JobCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Briefcase,
  Clock,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ArrowUpRight,
  Bookmark,
  Share2,
} from 'lucide-react';
import { JobListing } from '@/types/job.types';
import { formatRupiah } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface JobCardProps {
  job: JobListing;
  onSelect: (job: JobListing) => void;
  onOpenAiMatch?: (job: JobListing) => void;
  selectedProgramFilter?: string;
}

export default function JobCard({
  job,
  onSelect,
  onOpenAiMatch,
  selectedProgramFilter,
}: JobCardProps) {
  const [imgError, setImgError] = React.useState(false);

  // Cek apakah lowongan ini selaras dengan filter program pelatihan yang dipilih user
  const isMatchingProgram = selectedProgramFilter
    ? job.relevantTrainingPrograms.some((p) =>
        p.toLowerCase().includes(selectedProgramFilter.toLowerCase())
      )
    : false;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const url = `${window.location.origin}/karir?id=${job.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Tautan lowongan berhasil disalin!');
    }
  };

  const getCompanyTypeBadge = () => {
    if (job.source === 'jsearch_realtime') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Live {job.applySource || 'Realtime API'}
        </span>
      );
    }

    switch (job.companyType) {
      case 'Mitra Industri STP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Mitra STP
          </span>
        );
      case 'Tenant Inkubasi Startup STP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Tenant Inkubasi
          </span>
        );
      case 'BUMN & Pemerintah':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-600" />
            BLUD / Pemda
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
            Industri
          </span>
        );
    }
  };

  const formattedSalary = React.useMemo(() => {
    if (!job.salary.isDisclosed) return 'Gaji Kompetitif';
    if (job.salary.min && job.salary.max) {
      return `${formatRupiah(job.salary.min)} - ${formatRupiah(job.salary.max)}`;
    }
    if (job.salary.min) return `Mulai ${formatRupiah(job.salary.min)}`;
    if (job.salary.max) return `Hingga ${formatRupiah(job.salary.max)}`;
    return 'Gaji Dirahasiakan';
  }, [job.salary]);

  return (
    <div
      onClick={() => onSelect(job)}
      className={`public-card public-card-hover group flex flex-col justify-between overflow-hidden relative cursor-pointer border transition-all duration-300 ${
        isMatchingProgram
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/20 via-white to-white'
          : 'border-slate-200/80 hover:border-emerald-300'
      }`}
    >
      {/* ─── Top Header Card ─── */}
      <div className="p-4 sm:p-5 pb-3">
        {/* Top Badges & Actions */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {getCompanyTypeBadge()}
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 border-slate-200">
              {job.workType}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 border-slate-200">
              {job.workSetup}
            </Badge>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleShare}
              title="Bagikan lowongan"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Company Logo & Job Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 p-1 shrink-0 flex items-center justify-center overflow-hidden group-hover:border-emerald-400 transition-colors">
            {job.companyLogo && !imgError ? (
              <Image
                src={job.companyLogo}
                alt={job.company}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-lg"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <Building2 className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
              {job.title}
            </h3>
            <p className="text-xs font-semibold text-slate-600 line-clamp-1 mt-0.5 flex items-center gap-1">
              <span>{job.company}</span>
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {job.location}
              </span>
            </div>
          </div>
        </div>

        {/* Relevansi Pelatihan Alumni STP */}
        {job.relevantTrainingPrograms.length > 0 && (
          <div className="mb-3 p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold">Kurikulum Selaras: </span>
              <span className="text-amber-800 line-clamp-1">
                {job.relevantTrainingPrograms.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Skills Tag Pills */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 group-hover:bg-slate-200/80 transition-colors"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-400 bg-slate-50">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* ─── Bottom Footer Card ─── */}
      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Rentang Gaji ({job.salary.period})
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
              {formattedSalary}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            {job.experienceLevel.includes('Fresh') ? 'Fresh Grad / Alumni' : job.experienceLevel}
          </span>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onOpenAiMatch && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAiMatch(job);
              }}
              className="h-8 text-xs font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 gap-1.5 rounded-xl shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Matcher</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => onSelect(job)}
            className={`h-8 text-xs font-bold gap-1 rounded-xl shadow-xs ${
              onOpenAiMatch
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>Detail & Lamar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
