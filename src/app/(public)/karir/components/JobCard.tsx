import React from 'react';
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
  ArrowUpRight,
  Banknote,
  CheckCircle2,
} from 'lucide-react';
import { JobListing } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import JobShareMenu from './JobShareMenu';

interface JobCardProps {
  job: JobListing;
  onSelect?: (job: JobListing) => void;
  onOpenAiMatch?: (job: JobListing) => void;
  selectedProgramFilter?: string;
  isApplied?: boolean;
}

export default function JobCard({
  job,
  onSelect,
  onOpenAiMatch,
  selectedProgramFilter,
  isApplied,
}: JobCardProps) {
  const router = useRouter();
  const [imgError, setImgError] = React.useState(false);

  // Cek apakah lowongan ini selaras dengan filter program pelatihan yang dipilih user
  const isMatchingProgram = selectedProgramFilter
    ? job.relevantTrainingPrograms.some((p) =>
        p.toLowerCase().includes(selectedProgramFilter.toLowerCase())
      )
    : false;

  const daysAgo = Math.max(0, Math.floor((Date.now() - job.postedAt) / (1000 * 60 * 60 * 24)));
  const freshnessLabel =
    daysAgo === 0 ? 'Hari ini' : daysAgo === 1 ? '1 hari lalu' : `${daysAgo} hari lalu`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sintesa_karir_last_viewed_id', job.id);
    }
    if (onSelect) {
      // Jika pengguna menekan Ctrl / Cmd / Klik tengah, biarkan browser membuka tab baru secara native
      if (e.ctrlKey || e.metaKey || e.button === 1) {
        return;
      }
      e.preventDefault();
      onSelect(job);
    }
  };

  const handleNavigateAiMatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sintesa_karir_last_viewed_id', job.id);
    }
    if (onOpenAiMatch) {
      onOpenAiMatch(job);
    } else {
      router.push(`/karir/${job.id}#ai-match`);
    }
  };

  const getCompanyTypeBadge = () => {
    if (job.isStpPartner) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Mitra Resmi STP
        </span>
      );
    }

    if (job.source === 'ats_public') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <Building2 className="w-3 h-3 text-indigo-600" />
          Perusahaan Terverifikasi
        </span>
      );
    }

    if (job.source === 'open_api') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Peluang Global / Remote
        </span>
      );
    }

    if (job.source === 'jsearch_realtime') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
          <Building2 className="w-3 h-3 text-sky-600" />
          Lowongan Terbuka
        </span>
      );
    }

    switch (job.companyType) {
      case 'Tenant Inkubasi Startup STP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Tenant Inkubasi
          </span>
        );
      case 'BUMN & Pemerintah':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Building2 className="w-3 h-3 text-blue-600" />
            BLUD / Pemda
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs">
            Industri Rekruter
          </span>
        );
    }
  };

  const formattedSalary = React.useMemo(() => {
    if (!job.salary.isDisclosed) return 'Gaji Kompetitif';
    const curr = job.salary.currency || 'IDR';
    if (job.salary.min && job.salary.max) {
      return `${formatSalary(job.salary.min, curr)} - ${formatSalary(job.salary.max, curr)}`;
    }
    if (job.salary.min) return `Mulai ${formatSalary(job.salary.min, curr)}`;
    if (job.salary.max) return `Hingga ${formatSalary(job.salary.max, curr)}`;
    return 'Gaji Dirahasiakan';
  }, [job.salary]);

  return (
    <Link
      id={`job-card-${job.id}`}
      href={`/karir/${job.id}`}
      onClick={handleCardClick}
      className={`public-card public-card-hover group flex flex-col justify-between overflow-hidden relative cursor-pointer border rounded-2xl sm:rounded-3xl transition-all duration-300 no-underline text-inherit block active:bg-slate-50/60 ${
        isMatchingProgram
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/30 via-white to-white'
          : 'border-slate-200/90 hover:border-emerald-300 bg-white'
      }`}
    >
      {/* ─── Top Header Card ─── */}
      <div className="p-4 sm:p-5 pb-3">
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {isApplied && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Sudah Dilamar
              </span>
            )}
            {getCompanyTypeBadge()}
            {job.region === 'indonesia' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                🇮🇩 IDN
              </span>
            )}
            {job.region === 'asean' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 shadow-2xs">
                🌏 ASEAN
              </span>
            )}
            {job.region === 'east_asia' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                🇯🇵/🇰🇷 Asia
              </span>
            )}
            <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 border-slate-200">
              {job.workType}
            </Badge>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
              <Clock className="w-2.5 h-2.5 text-emerald-600" />
              {freshnessLabel}
            </span>
          </div>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <JobShareMenu job={job} variant="compact-icon" />
          </div>
        </div>

        {/* Company Logo & Job Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/90 p-1 shrink-0 flex items-center justify-center overflow-hidden group-hover:border-emerald-400 group-hover:shadow-xs transition-all">
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
            <h3 className="font-extrabold text-[15px] sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug tracking-tight">
              {job.title}
            </h3>
            <p className="text-xs font-semibold text-slate-600 line-clamp-1 mt-0.5 flex items-center gap-1">
              <span>{job.company}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="flex items-center gap-1 truncate max-w-[170px] sm:max-w-none">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {job.location}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-500 font-medium">
                {job.workSetup}
              </span>
            </div>
          </div>
        </div>

        {/* Relevansi Pelatihan Alumni STP */}
        {job.relevantTrainingPrograms.length > 0 && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-950 flex items-start gap-2 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-amber-900">Kurikulum Selaras STP: </span>
              <span className="text-amber-800 line-clamp-1 font-medium">
                {job.relevantTrainingPrograms.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Highlight Gaji (Sangat eye-catching dan ramah ponsel) */}
        <div className="mb-3 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider leading-none">
                Estimasi Gaji ({job.salary.period})
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-950 truncate block mt-0.5">
                {formattedSalary}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {job.experienceLevel.includes('Fresh') ? 'Fresh Grad' : job.experienceLevel}
          </span>
        </div>

        {/* Skills Tag Pills */}
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 group-hover:bg-slate-200/80 transition-colors"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/50">
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* ─── Bottom Footer Card (Ergonomis jempol ponsel, min 44px touch target) ─── */}
      <div className="p-3 sm:p-4 pt-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleNavigateAiMatch}
          className="h-11 sm:h-9 px-3.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 gap-1.5 rounded-xl shadow-xs active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI Matcher</span>
        </Button>

        <div
          className={`h-11 sm:h-9 px-4 text-xs font-extrabold gap-1.5 rounded-xl shadow-xs active:scale-95 text-white flex items-center justify-center transition-all flex-1 ${
            isApplied
              ? 'bg-emerald-700 hover:bg-emerald-800'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <span>{isApplied ? 'Tinjau Lamaran' : 'Detail & Lamar'}</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
