'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SectionContainer from '@/components/ui/SectionContainer';
import { 
  TrainingReviewProgram, 
  TrainingReviewItem, 
  ReviewerRole, 
  REVIEWER_ROLE_LABELS, 
  REVIEWER_ROLE_BADGES 
} from '@/types';
import { learningReviewService } from '@/services/learningReview.service';
import { motion } from 'framer-motion';
import { 
  Star, 
  Sparkles, 
  GraduationCap, 
  ThumbsUp, 
  MessageSquareQuote, 
  Plus, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Award,
  ExternalLink,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PublicReviewCard, PublicShareBar, PublicPagination } from '@/components/public';
import { toast } from 'sonner';
import Link from 'next/link';

interface ReviewPelatihanClientPageProps {
  initialProgramId?: string;
  isDirectProgramPage?: boolean;
}

export default function ReviewPelatihanClientPage({
  initialProgramId,
  isDirectProgramPage = false,
}: ReviewPelatihanClientPageProps = {}) {
  const searchParams = useSearchParams();
  const initialProgramQuery = searchParams.get('program');

  const [programs, setPrograms] = useState<TrainingReviewProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [reviews, setReviews] = useState<TrainingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Share States
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter Ulasan Publik
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  // State liked reviews local
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  const targetId = initialProgramId || initialProgramQuery;

  // 1. Fetch Program List & Target Program
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const progs = await learningReviewService.getReviewPrograms('ACTIVE');
        setPrograms(progs);

        if (targetId) {
          const matched = progs.find(p => p.id === targetId || p.slug === targetId);
          if (matched) {
            setSelectedProgramId(matched.id);
          } else {
            // Ambil langsung by ID/Slug (misal jika non-active atau id baru)
            const directProg = await learningReviewService.getReviewProgramById(targetId);
            if (directProg) {
              setPrograms(prev => prev.some(p => p.id === directProg.id) ? prev : [directProg, ...prev]);
              setSelectedProgramId(directProg.id);
            } else if (progs.length > 0) {
              setSelectedProgramId(progs[0].id);
            }
          }
        } else if (progs.length > 0) {
          setSelectedProgramId(progs[0].id);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [targetId]);

  // Program yang sedang aktif dipilih
  const currentProgram = useMemo(() => {
    return programs.find(p => p.id === selectedProgramId) || programs[0] || null;
  }, [programs, selectedProgramId]);

  // 2. Fetch Reviews untuk program terpilih
  useEffect(() => {
    if (!selectedProgramId) return;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const revs = await learningReviewService.getProgramReviews(selectedProgramId, 'PUBLISHED');
        setReviews(revs);
      } catch (err) {
        console.error('Error fetching program reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [selectedProgramId]);

  // Filter Ulasan
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchRole = filterRole === 'ALL' || rev.reviewerRole === filterRole;
      const matchRating = filterRating === 'ALL' || Math.round(rev.overallRating).toString() === filterRating;
      return matchRole && matchRating;
    });
  }, [reviews, filterRole, filterRating]);

  // Handler Like / Apresiasi Ulasan
  const handleLike = async (revId: string) => {
    if (likedReviews.has(revId)) return;
    setLikedReviews(prev => new Set(prev).add(revId));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r));
    await learningReviewService.likeReview(revId);
    toast.success('Terima kasih atas apresiasi Anda!');
  };

  // Helper URL & Share
  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = window.location.origin;
    const identifier = currentProgram?.slug || currentProgram?.id || 'smk-go-global-welder-2026';
    return `${base}/review-pelatihan/${identifier}`;
  };

  const handleCopyLink = async () => {
    const url = getDirectUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast.success('Tautan Halaman Ulasan Disalin!', {
        description: 'Siap dibagikan ke WhatsApp grup peserta, mentor, atau mitra.',
      });
    } catch {
      toast.error('Gagal menyalin tautan. Silakan salin URL dari address bar browser.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!currentProgram) return;
    const url = getDirectUrl();
    const text = `Halo rekan peserta & mentor, yuk berikan ulasan dan evaluasi mutu untuk pelatihan *${currentProgram.title}* di Solo Technopark. Pengisian mudah, cepat, dan bisa anonim melalui tautan ini:\n\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <SectionContainer accent="emerald" width="default" className="py-8 sm:py-12">
      {/* BREADCRUMB / NAVIGASI KEMBALI JIKA DI HALAMAN DIRECT PROGRAM */}
      {isDirectProgramPage && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/review-pelatihan"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            <span>Lihat Semua Program Pelatihan</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Tautan Khusus Program
            </span>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black tracking-wide border border-emerald-500/30 backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400" /> Portal Ulasan & Evaluasi Terbuka
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {isDirectProgramPage && currentProgram ? (
              <>Ulasan: {currentProgram.title}</>
            ) : (
              'Transparansi Kualitas Pelatihan Vokasi'
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            Dengar langsung testimoni dan evaluasi otentik dari <strong>Peserta Pelatihan</strong>, <strong>Instruktur Penguji</strong>, dan <strong>Mitra Industri Kerja</strong>. Terbuka bagi siapa saja untuk memberi ulasan tanpa perlu login akun.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/review-pelatihan/${currentProgram?.slug || currentProgram?.id || 'smk-go-global-welder-2026'}#form-ulasan`}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm px-6 h-11 shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Plus size={16} className="mr-2" /> Tulis Review Pelatihan
            </Link>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 h-11 border border-white/15 backdrop-blur-md transition-colors"
            >
              {copiedLink ? <Check size={15} className="mr-2 text-emerald-400" /> : <Share2 size={15} className="mr-2" />}
              {copiedLink ? 'Link Tersalin!' : 'Bagikan Program'}
            </Button>
            <Link
              href="/program-pelatihan"
              className="inline-flex items-center justify-center rounded-xl bg-transparent hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs sm:text-sm px-4 h-11 transition-colors"
            >
              <span>Katalog Pelatihan</span>
              <ArrowRight size={15} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* WIDGET BAGIKAN LINK KHUSUS & AKSES CEPAT PENGISIAN */}
      {currentProgram && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-slate-50 border border-emerald-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                <Share2 size={14} />
              </span>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                Tautan Khusus Program: {currentProgram.title}
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Bagikan tautan langsung ini ke grup WhatsApp peserta atau mentor agar mudah diakses tanpa harus mencari.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            <Link
              href={`/review-pelatihan/${currentProgram.slug || currentProgram.id}`}
              className="inline-flex items-center rounded-xl h-9 text-xs font-bold bg-white border border-slate-200 px-3 hover:bg-slate-50 hover:text-emerald-700 shadow-2xs"
            >
              <span>Halaman Ulasan Khusus</span>
              <ExternalLink size={13} className="ml-1.5" />
            </Link>

            <PublicShareBar
              title={`Review Program Pelatihan: ${currentProgram.title}`}
              description={currentProgram.shortDescription || 'Lihat evaluasi dan ulasan terbuka peserta pelatihan vokasi di Solo Technopark.'}
              variant="pill"
              label="Bagikan"
            />
          </div>
        </div>
      )}

      {/* SELECTOR PROGRAM PELATIHAN */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Pilih Program Pelatihan Yang Sedang Berjalan:
          </Label>
          <span className="text-xs text-slate-500 font-bold">
            {programs.length} Program Dibuka untuk Review
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {programs.map((prog) => {
            const isSelected = prog.id === selectedProgramId;
            return (
              <button
                key={prog.id}
                onClick={() => setSelectedProgramId(prog.id)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all text-left flex items-center gap-3 border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div className="font-black text-sm truncate max-w-[240px] sm:max-w-[320px]">
                    {prog.title}
                  </div>
                  <div className={`text-[11px] font-medium flex items-center gap-2 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    <span>{prog.batch}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star size={11} className="fill-amber-400" />
                      {prog.stats?.averageRating || 0}
                    </span>
                    <span>({prog.stats?.totalReviews || 0} ulasan)</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KARTU OVERVIEW PROGRAM TERPILIH & STATISTIK ASPEK */}
      {currentProgram && (
        <div className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Sisi Kiri: Profil Singkat Program */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {currentProgram.category}
                  </span>
                  {currentProgram.partnerInstitution && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                      {currentProgram.partnerInstitution}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-400">
                    {currentProgram.batch} ({currentProgram.year})
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {currentProgram.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {currentProgram.shortDescription}
                </p>

                <div className="pt-2 text-xs text-slate-500 font-medium space-y-1">
                  <div>🏢 <strong>Penyelenggara:</strong> {currentProgram.organizer}</div>
                  <div>🎯 <strong>Target Peserta:</strong> {currentProgram.targetAudience}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skor Kepuasan</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-3xl font-black text-slate-900">{currentProgram.stats?.averageRating || 0}</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={16} 
                          className={s <= Math.round(currentProgram.stats?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Berdasarkan {currentProgram.stats?.totalReviews || 0} ulasan resmi</p>
                </div>

                <Link
                  href={`/review-pelatihan/${currentProgram.slug || currentProgram.id}#form-ulasan`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 transition-colors"
                >
                  <Plus size={14} className="mr-1.5" /> Beri Ulasan
                </Link>
              </div>
            </div>

            {/* Sisi Kanan: Grafik Rating per Aspek Kustom yang Disetting Admin */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award size={18} className="text-emerald-600" /> Evaluasi Aspek Kunci Program
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aspek-aspek berikut dikonfigurasi langsung oleh pengelola Solo Technopark untuk mengukur efektivitas program:
                </p>
              </div>

              <div className="space-y-4">
                {currentProgram.aspects?.map((aspect) => {
                  const score = currentProgram.stats?.aspectScores?.[aspect.id] || currentProgram.stats?.averageRating || 4.8;
                  const percentage = Math.min(Math.round((score / 5) * 100), 100);

                  return (
                    <div key={aspect.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-black text-slate-800">{aspect.label}</span>
                          {aspect.description && (
                            <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline">• {aspect.description}</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-emerald-700">{score.toFixed(1)} / 5.0</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                  Seluruh hasil review dikompilasi secara real-time dan menjadi bahan evaluasi peningkatan kurikulum pelatihan vokasi bersama BP3MI Jawa Tengah dan Asosiasi Industri.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & DAFTAR REVIEW */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Ulasan & Testimoni Terpublikasi ({filteredReviews.length})
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan ulasan dari peserta pelatihan, instruktur/mentor, dan mitra industri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Peran Reviewer</option>
              <option value="PESERTA">Peserta Pelatihan / Alumni</option>
              <option value="MENTOR">Instruktur / Mentor</option>
              <option value="INDUSTRI">Mitra Industri / Perusahaan</option>
              <option value="PUBLIK">Masyarakat Umum</option>
            </select>

            <select
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Rating</option>
              <option value="5">Bintang 5</option>
              <option value="4">Bintang 4</option>
              <option value="3">Bintang 3</option>
              <option value="2">Bintang 2</option>
              <option value="1">Bintang 1</option>
            </select>
          </div>
        </div>

        {/* LIST REVIEW */}
        {loadingReviews ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="font-bold text-slate-500 text-xs">Memuat ulasan peserta...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">Belum ada ulasan yang sesuai filter.</p>
            <p className="text-xs text-slate-400 mt-1">Jadilah yang pertama memberikan ulasan untuk program ini!</p>
            {currentProgram && (
              <Link
                href={`/review-pelatihan/${currentProgram.slug || currentProgram.id}#form-ulasan`}
                className="mt-4 inline-flex items-center rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 transition-colors"
              >
                <Plus size={14} className="mr-1.5" /> Tulis Review Sekarang
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReviews.map((rev) => (
              <div 
                key={rev.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Badge & Rating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        REVIEWER_ROLE_BADGES[rev.reviewerRole] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {REVIEWER_ROLE_LABELS[rev.reviewerRole] || rev.reviewerRole}
                      </span>
                      {rev.reviewerInstitution && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          • {rev.reviewerInstitution}
                        </span>
                      )}
                    </div>

                    <div className="flex text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={star <= rev.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Headline & Feedback */}
                  <div>
                    <h4 className="font-black text-slate-900 text-base leading-snug mb-1.5">
                      "{rev.headline}"
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {rev.feedback}
                    </p>
                  </div>

                  {/* Saran Perbaikan jika ada */}
                  {rev.suggestions && (
                    <div className="text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                      <span className="font-bold">Masukan untuk batch berikutnya:</span> {rev.suggestions}
                    </div>
                  )}

                  {/* Detail Skor per Aspek */}
                  {rev.aspectRatings && Object.keys(rev.aspectRatings).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(rev.aspectRatings).map(([aspKey, val]) => (
                        <span 
                          key={aspKey}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] rounded-md font-medium capitalize"
                        >
                          {aspKey.replace(/_/g, ' ')}: <strong className="text-emerald-700">{val}★</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Balasan Resmi Solo Technopark */}
                  {rev.adminResponse && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>Tanggapan Resmi Pengelola Solo Technopark:</span>
                      </div>
                      <p className="text-emerald-950 text-[11px] leading-relaxed">{rev.adminResponse}</p>
                    </div>
                  )}
                </div>

                {/* Footer Kartu Review */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-800 text-xs">{rev.reviewerName}</span>
                      {rev.isAnonymous !== false && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <ShieldCheck size={10} className="text-emerald-600" /> Anonim Terverifikasi
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleLike(rev.id!)}
                    disabled={likedReviews.has(rev.id!)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      likedReviews.has(rev.id!)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <ThumbsUp size={13} className={likedReviews.has(rev.id!) ? 'fill-emerald-600 text-emerald-600' : ''} />
                    <span>{rev.likesCount || 0} Bermanfaat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </SectionContainer>
  );
}

