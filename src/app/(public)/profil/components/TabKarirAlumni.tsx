'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Bookmark, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  MapPin, 
  ExternalLink,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobListing } from '@/types/job.types';
import { useJobs } from '@/hooks/useJobs';
import { toast } from 'sonner';

export default function TabKarirAlumni({ userEmail, alumniProgram }: { userEmail: string; alumniProgram?: string }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const { data: jobData, isLoading } = useJobs({
    freshness: 'all',
  });

  const allJobs = jobData?.jobs || [];

  // Ambil bookmark dari localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sintesa_bookmarked_jobs');
      if (raw) {
        setBookmarkedIds(JSON.parse(raw));
      }
    } catch {
      setBookmarkedIds([]);
    }
  }, []);

  const handleRemoveBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = bookmarkedIds.filter(b => b !== id);
    setBookmarkedIds(updated);
    localStorage.setItem('sintesa_bookmarked_jobs', JSON.stringify(updated));
    toast.success('Lowongan dihapus dari daftar tersimpan');
  };

  const bookmarkedJobs = allJobs.filter(j => bookmarkedIds.includes(j.id));
  
  // Rekomendasi berdasarkan program pelatihan alumni jika ada
  const recommendedJobs = allJobs
    .filter(j => !bookmarkedIds.includes(j.id))
    .slice(0, 3);

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
          <div className="pt-2 flex items-center gap-2">
            <Link href="/karir">
              <Button className="h-9 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-900 font-extrabold text-xs gap-1.5 shadow-sm">
                <span>Eksplorasi Seluruh Lowongan</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
                      onClick={(e) => handleRemoveBookmark(job.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
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
                    {job.salary.isDisclosed && job.salary.min 
                      ? `Rp ${job.salary.min.toLocaleString('id-ID')} / ${job.salary.period}`
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

      {/* SEKSI 2: REKOMENDASI LOWONGAN MITRA INDUSTRI */}
      {recommendedJobs.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={13} className="text-teal-500" />
            <span>Rekomendasi Karir Mitra Industri STP</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendedJobs.map(job => (
              <Link 
                key={job.id} 
                href={`/karir/${job.id}`}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all block group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-teal-600">{job.workSetup}</span>
                  <span className="text-[10px] text-slate-400">{job.experienceLevel}</span>
                </div>
                <h6 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                  {job.title}
                </h6>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{job.company}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

