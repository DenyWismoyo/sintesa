'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Bookmark,
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
  GraduationCap,
  Trash2,
  BellRing,
  Target,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alumni } from '@/types/ecosystem.types';
import { useJobs } from '@/hooks/useJobs';
import { useBookmarkedJobs, useCurrentAlumniProfile } from '@/hooks/useBookmarkedJobs';
import { computeAlumniJobMatch } from '@/utils/jobSmartMatch';
import { formatSalary } from '@/utils/format';
import { alumniService } from '@/services/alumni.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function TabKarirAlumni({
  userEmail,
  alumniProgram,
  alumniProfile: initialAlumniProfile,
}: {
  userEmail: string;
  alumniProgram?: string;
  alumniProfile?: Alumni | null;
}) {
  const queryClient = useQueryClient();
  const { data: fetchedAlumni } = useCurrentAlumniProfile();
  const activeAlumni = initialAlumniProfile || fetchedAlumni || null;

  const { bookmarkedIds, toggleBookmark } = useBookmarkedJobs();
  const { data: jobData } = useJobs({
    freshness: 'all',
  });

  const [preferredRegion, setPreferredRegion] = useState<string>(activeAlumni?.preferredRegion || 'all');
  const [preferredWorkSetup, setPreferredWorkSetup] = useState<string>(activeAlumni?.preferredWorkSetup || 'all');
  const [isLookingForJob, setIsLookingForJob] = useState<boolean>(activeAlumni?.isLookingForJob ?? true);
  const [jobAlertEnabled, setJobAlertEnabled] = useState<boolean>(activeAlumni?.jobAlertEnabled ?? true);
  const [isSavingPref, setIsSavingPref] = useState(false);

  useEffect(() => {
    if (!activeAlumni) return;
    setPreferredRegion(activeAlumni.preferredRegion || 'all');
    setPreferredWorkSetup(activeAlumni.preferredWorkSetup || 'all');
    setIsLookingForJob(activeAlumni.isLookingForJob ?? true);
    setJobAlertEnabled(activeAlumni.jobAlertEnabled ?? true);
  }, [activeAlumni]);

  const allJobs = jobData?.jobs || [];

  const handleRemoveBookmark = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(id, title);
  };

  const handleSavePreferences = async () => {
    if (!activeAlumni?.id) return;
    setIsSavingPref(true);
    try {
      await alumniService.updateAlumni(activeAlumni.id, {
        preferredRegion: preferredRegion === 'all' ? '' : preferredRegion,
        preferredWorkSetup: preferredWorkSetup === 'all' ? '' : preferredWorkSetup,
        isLookingForJob,
        jobAlertEnabled,
        updatedAt: Date.now(),
      });
      queryClient.invalidateQueries({ queryKey: ['current-alumni-profile'] });
      toast.success('Preferensi Karir & Smart Job Alert berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan preferensi karir.');
    } finally {
      setIsSavingPref(false);
    }
  };

  const bookmarkedJobs = useMemo(
    () => allJobs.filter((j) => bookmarkedIds.includes(j.id)),
    [allJobs, bookmarkedIds]
  );

  // Rekomendasi Cerdas berbasis Kejuruan Diklat, Skills & Preferensi Alumni
  const recommendedWithScore = useMemo(() => {
    const profileBasis: Partial<Alumni> = activeAlumni
      ? {
          ...activeAlumni,
          preferredRegion: preferredRegion === 'all' ? activeAlumni.preferredRegion : preferredRegion,
          preferredWorkSetup: preferredWorkSetup === 'all' ? activeAlumni.preferredWorkSetup : preferredWorkSetup,
        }
      : { programTaken: alumniProgram };

    return allJobs
      .filter((j) => !bookmarkedIds.includes(j.id))
      .map((job) => ({
        job,
        match: computeAlumniJobMatch(job, profileBasis),
      }))
      .sort((a, b) => {
        if (b.match.score !== a.match.score) return b.match.score - a.match.score;
        return b.job.postedAt - a.job.postedAt;
      })
      .slice(0, 6);
  }, [allJobs, bookmarkedIds, activeAlumni, alumniProgram, preferredRegion, preferredWorkSetup]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-lg border border-teal-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Briefcase size={120} />
        </div>
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
            <GraduationCap size={14} />
            <span>Penyaluran Tenaga Kerja Industri</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pelacakan Karir & Lowongan Mitra
          </h3>
          <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
            Pantau lowongan kerja industri yang Anda simpan, dan dapatkan prioritas penyaluran kerja eksklusif bagi lulusan Solo Technopark.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Link href="/karir?feed=for_you&sort=best_match">
              <Button className="h-9 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs gap-1.5 shadow-sm">
                <Target size={14} />
                <span>Buka Feed Rekomendasi Saya</span>
              </Button>
            </Link>
            <Link href="/karir">
              <Button variant="outline" className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs gap-1.5">
                <span>Eksplorasi Semua Lowongan</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* SEKSI PREFERENSI KARIR & SMART JOB ALERT (KHUSUS ALUMNI TERKLAIM) */}
      {activeAlumni?.id && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-teal-600" />
                <span>Preferensi Karir & Smart Job Alert Otomatis</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sistem akan memberi tahu Anda secara otomatis saat sinkronisasi harian menemukan lowongan yang cocok dengan target Anda.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isSavingPref}
              onClick={handleSavePreferences}
              className="h-8.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1.5 shrink-0"
            >
              {isSavingPref ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              <span>Simpan Preferensi</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Wilayah Kerja
              </label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="all">Semua Wilayah</option>
                <option value="solo">Solo Raya & Jawa Tengah</option>
                <option value="indonesia">Indonesia (Nasional)</option>
                <option value="asean">ASEAN (Singapura / Malaysia)</option>
                <option value="jepang">Jepang (Tokutei Ginou / Engineer)</option>
                <option value="korea">Korea Selatan</option>
                <option value="global_remote">Global Remote / WFH</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Model Kerja Diinginkan
              </label>
              <select
                value={preferredWorkSetup}
                onChange={(e) => setPreferredWorkSetup(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="all">Fleksibel (Semua Model)</option>
                <option value="On-site">On-site / Tatap Muka</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote / WFH">Remote / WFH</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isLookingForJob}
                onChange={(e) => setIsLookingForJob(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-800 block leading-tight">Status Open-to-Work</span>
                <span className="text-[10px] text-slate-500">Tampil di Talent Pool Mitra</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={jobAlertEnabled}
                onChange={(e) => setJobAlertEnabled(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1 leading-tight">
                  <BellRing size={12} className="text-amber-500" /> Smart Job Alert
                </span>
                <span className="text-[10px] text-slate-500">Notifikasi loker baru cocok</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SEKSI 1: LOWONGAN TERSIMPAN (BOOKMARKS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Bookmark size={16} className="text-amber-500" />
            <span>Lowongan Tersimpan ({bookmarkedJobs.length})</span>
          </h4>
        </div>

        {bookmarkedJobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
              <Bookmark size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Belum Ada Lowongan Tersimpan</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Buka kanal Bursa Karir dan klik tombol simpan untuk memantau peluang kerja impian Anda di sini.
              </p>
            </div>
            <Link href="/karir" className="inline-block pt-1">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                Cari Lowongan Mitra
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarkedJobs.map(job => (
              <div 
                key={job.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-600">
                      {job.workType}
                    </Badge>
                    <button
                      onClick={(e) => handleRemoveBookmark(job.id, job.title, e)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Hapus Simpanan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <Link href={`/karir/${job.id}`}>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                        {job.title}
                      </h5>
                    </Link>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      <span>{job.company}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-amber-500" />
                      <span className="truncate">{job.location}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-black text-teal-700">
                    {job.salary.isDisclosed && (job.salary.min || job.salary.max)
                      ? `${formatSalary(job.salary.min || job.salary.max || 0, job.salary.currency || 'IDR')} / ${job.salary.period}`
                      : 'Kompetitif'}
                  </span>
                  <Link href={`/karir/${job.id}`}>
                    <Button size="sm" className="h-7 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] gap-1">
                      <span>Lihat Detail</span>
                      <ArrowRight size={11} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEKSI 2: REKOMENDASI LOWONGAN YANG SELARAS DENGAN DIKLAT & SKILL ALUMNI */}
      {recommendedWithScore.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-600" />
              <span>
                Rekomendasi Paling Sesuai {activeAlumni?.programTaken ? `(${activeAlumni.programTaken})` : 'Profil Anda'}
              </span>
            </h4>
            <Link href="/karir?feed=for_you&sort=best_match" className="text-xs font-bold text-teal-700 hover:underline">
              Lihat Semua →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendedWithScore.map(({ job, match }) => (
              <Link 
                key={job.id} 
                href={`/karir/${job.id}`}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Target size={10} />
                      <span>{match.score}% {match.grade}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 truncate">{job.city}</span>
                  </div>
                  <h6 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                    {job.title}
                  </h6>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{job.company}</p>
                </div>
                {match.reasons[0] && (
                  <p className="text-[10px] text-teal-700 font-semibold mt-2 pt-2 border-t border-slate-100 truncate">
                    ✓ {match.reasons[0]}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

