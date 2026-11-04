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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Sparkles, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquareQuote, 
  Plus, 
  Filter, 
  ArrowRight, 
  Send, 
  Loader2, 
  ShieldCheck, 
  HelpCircle, 
  Award,
  ChevronDown,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReviewPelatihanClientPage() {
  const searchParams = useSearchParams();
  const initialProgramQuery = searchParams.get('program');

  const [programs, setPrograms] = useState<TrainingReviewProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [reviews, setReviews] = useState<TrainingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Filter Ulasan Publik
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  // Modal Tulis Review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    reviewerName: '',
    isAnonymous: true, // Default anonim demi privasi pengulas
    reviewerRole: 'PESERTA' as ReviewerRole,
    reviewerRoleCustom: '',
    reviewerEmail: '',
    reviewerInstitution: '',
    overallRating: 5,
    aspectRatings: {} as Record<string, number>,
    headline: '',
    feedback: '',
    suggestions: '',
    isRecommended: true,
  });

  // State liked reviews local
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // 1. Fetch Program List
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const progs = await learningReviewService.getReviewPrograms('ACTIVE');
        setPrograms(progs);
        if (progs.length > 0) {
          if (initialProgramQuery && progs.some(p => p.id === initialProgramQuery)) {
            setSelectedProgramId(initialProgramQuery);
          } else {
            setSelectedProgramId(progs[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [initialProgramQuery]);

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

  // Inisialisasi aspectRatings saat program berganti
  useEffect(() => {
    if (currentProgram && currentProgram.aspects) {
      const initialAspects: Record<string, number> = {};
      currentProgram.aspects.forEach(asp => {
        initialAspects[asp.id] = 5;
      });
      setFormData(prev => ({
        ...prev,
        aspectRatings: initialAspects,
      }));
    }
  }, [currentProgram]);

  // Filter Ulasan
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchRole = filterRole === 'ALL' || rev.reviewerRole === filterRole;
      const matchRating = filterRating === 'ALL' || Math.round(rev.overallRating).toString() === filterRating;
      return matchRole && matchRating;
    });
  }, [reviews, filterRole, filterRating]);

  // Handler Kirim Review Publik (Tanpa Perlu Login & Anonim-First)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProgram) return;

    if (!formData.isAnonymous && !formData.reviewerName.trim()) {
      toast.error('Mohon isi nama Anda jika tidak memilih opsi anonim.');
      return;
    }
    if (!formData.headline.trim()) {
      toast.error('Mohon isi judul ringkasan ulasan Anda.');
      return;
    }
    if (!formData.feedback.trim() || formData.feedback.trim().length < 10) {
      toast.error('Ulasan pengalaman minimal 10 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await learningReviewService.submitPublicReview({
        programId: currentProgram.id,
        programTitle: currentProgram.title,
        reviewerName: formData.reviewerName.trim(),
        isAnonymous: formData.isAnonymous,
        reviewerRole: formData.reviewerRole,
        reviewerRoleCustom: formData.reviewerRoleCustom.trim(),
        reviewerEmail: formData.reviewerEmail.trim(),
        reviewerInstitution: formData.reviewerInstitution.trim(),
        overallRating: formData.overallRating,
        aspectRatings: formData.aspectRatings,
        headline: formData.headline.trim(),
        feedback: formData.feedback.trim(),
        suggestions: formData.suggestions.trim(),
        isRecommended: formData.isRecommended,
      });

      toast.success('Ulasan Anda Berhasil Terkirim!', {
        description: 'Terima kasih atas kontribusi nyata Anda untuk kemajuan vokasi di Solo Technopark.',
      });

      setIsReviewModalOpen(false);
      // Reset form
      setFormData(prev => ({
        ...prev,
        reviewerName: '',
        reviewerRoleCustom: '',
        reviewerEmail: '',
        reviewerInstitution: '',
        overallRating: 5,
        headline: '',
        feedback: '',
        suggestions: '',
        isRecommended: true,
      }));

      // Refresh data ulasan & program
      const [updatedRevs, updatedProgs] = await Promise.all([
        learningReviewService.getProgramReviews(currentProgram.id, 'PUBLISHED'),
        learningReviewService.getReviewPrograms('ACTIVE'),
      ]);
      setReviews(updatedRevs);
      setPrograms(updatedProgs);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Like / Apresiasi Ulasan
  const handleLike = async (revId: string) => {
    if (likedReviews.has(revId)) return;
    setLikedReviews(prev => new Set(prev).add(revId));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r));
    await learningReviewService.likeReview(revId);
    toast.success('Terima kasih atas apresiasi Anda!');
  };

  return (
    <SectionContainer accent="emerald" width="default" className="py-8 sm:py-12">
      {/* HERO SECTION */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black tracking-wide border border-emerald-500/30 backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400" /> Portal Ulasan & Evaluasi Terbuka
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Transparansi Kualitas Pelatihan Vokasi
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            Dengar langsung testimoni dan evaluasi otentik dari <strong>Peserta Pelatihan</strong>, <strong>Instruktur Penguji</strong>, dan <strong>Mitra Industri Kerja</strong>. Terbuka bagi siapa saja untuk memberi ulasan tanpa perlu login akun.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              onClick={() => setIsReviewModalOpen(true)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm px-6 h-11 shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Plus size={16} className="mr-2" /> Tulis Review Pelatihan
            </Button>
            <Link
              href="/program-pelatihan"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 h-11 border border-white/15 backdrop-blur-md transition-colors"
            >
              <span>Katalog Semua Program</span>
              <ArrowRight size={15} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

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

                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4"
                >
                  <Plus size={14} className="mr-1.5" /> Beri Ulasan
                </Button>
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
            <Button
              onClick={() => setIsReviewModalOpen(true)}
              className="mt-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              <Plus size={14} className="mr-1.5" /> Tulis Review Sekarang
            </Button>
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

      {/* MODAL FORM TULIS REVIEW (AKSES PUBLIK TANPA LOGIN) */}
      <AnimatePresence>
        {isReviewModalOpen && currentProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                    <Sparkles size={11} /> Bebas Akses Publik
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Beri Ulasan Program Pelatihan
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentProgram.title} ({currentProgram.batch})
                  </p>
                </div>
                <button 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitReview} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  {/* Bagian 1: Peran & Identitas */}
                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      1. Siapa Anda dalam Program Ini? <span className="text-red-500">*</span>
                    </Label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['PESERTA', 'MENTOR', 'INDUSTRI', 'PUBLIK'] as ReviewerRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, reviewerRole: r })}
                          className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            formData.reviewerRole === r
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-sm">
                            {r === 'PESERTA' ? '🎓' : r === 'MENTOR' ? '👨‍🏫' : r === 'INDUSTRI' ? '🏭' : '👥'}
                          </span>
                          <span className="text-[11px] leading-tight">
                            {r === 'PESERTA' ? 'Peserta / Siswa' : r === 'MENTOR' ? 'Instruktur / Mentor' : r === 'INDUSTRI' ? 'Mitra Industri' : 'Publik / Umum'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Opsi Kirim Sebagai Anonim (Default Aktif) */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                      <input 
                        type="checkbox"
                        id="anon-checkbox"
                        checked={formData.isAnonymous}
                        onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="anon-checkbox" className="text-xs text-emerald-950 font-medium cursor-pointer">
                        <strong className="block text-emerald-900 font-bold">Kirim Ulasan Secara Anonim (Disarankan)</strong>
                        Identitas asli Anda dirahasiakan untuk kenyamanan dan kebebasan evaluasi. Ulasan akan ditampilkan di publik dengan nama peran (misal: <em>Peserta Welder • Anonim</em>).
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Nama Anda / Inisial {!formData.isAnonymous && <span className="text-red-500">*</span>}
                        </Label>
                        <Input 
                          required={!formData.isAnonymous}
                          value={formData.reviewerName}
                          onChange={e => setFormData({ ...formData, reviewerName: e.target.value })}
                          placeholder={formData.isAnonymous ? "Opsional (disamarkan otomatis)" : "Contoh: Budi Santoso"}
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Keterangan Asal / Lembaga (Opsional)</Label>
                        <Input 
                          value={formData.reviewerInstitution}
                          onChange={e => setFormData({ ...formData, reviewerInstitution: e.target.value })}
                          placeholder="Contoh: Lulusan Welder Kendal / Mitra API"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">Alamat Email (Opsional, 100% tidak dipublikasikan)</Label>
                        <Input 
                          type="email"
                          value={formData.reviewerEmail}
                          onChange={e => setFormData({ ...formData, reviewerEmail: e.target.value })}
                          placeholder="emailanda@example.com (hanya untuk arsip internal panitia)"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Rating Bintang Keseluruhan */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <Label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      2. Berapa Bintang Rating Keseluruhan Anda? <span className="text-red-500">*</span>
                    </Label>

                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, overallRating: star })}
                          className="p-1.5 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                        >
                          <Star 
                            size={28} 
                            className={star <= formData.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} 
                          />
                        </button>
                      ))}
                      <span className="ml-3 font-black text-slate-900 text-sm">
                        {formData.overallRating} dari 5 Bintang
                      </span>
                    </div>
                  </div>

                  {/* Bagian 3: Rating Per Aspek Kustom yang Dikonfigurasi Admin */}
                  {currentProgram.aspects && currentProgram.aspects.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div>
                        <Label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                          3. Penilaian Aspek Spesifik Program:
                        </Label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Berikan rating 1 sampai 5 bintang untuk tiap aspek berikut:
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {currentProgram.aspects.map((aspect) => (
                          <div 
                            key={aspect.id}
                            className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                          >
                            <div>
                              <span className="text-xs font-black text-slate-800 block">{aspect.label}</span>
                              {aspect.description && (
                                <span className="text-[10px] text-slate-500">{aspect.description}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {[1, 2, 3, 4, 5].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    aspectRatings: { ...prev.aspectRatings, [aspect.id]: st }
                                  }))}
                                  className="p-1 hover:scale-115 transition-transform cursor-pointer"
                                >
                                  <Star 
                                    size={18} 
                                    className={(formData.aspectRatings[aspect.id] || 5) >= st ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                                  />
                                </button>
                              ))}
                              <span className="text-xs font-bold text-slate-700 ml-1.5 w-6 text-center">
                                {formData.aspectRatings[aspect.id] || 5}★
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bagian 4: Ulasan & Saran */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <Label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      4. Ulasan & Pengalaman Nyata Anda:
                    </Label>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Judul Ringkasan Ulasan <span className="text-red-500">*</span></Label>
                      <Input 
                        required
                        value={formData.headline}
                        onChange={e => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="Contoh: Sangat puas dengan booth las dan bimbingan instruktur"
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Ceritakan Pengalaman Anda Selama Pelatihan <span className="text-red-500">*</span></Label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.feedback}
                        onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                        placeholder="Bagaimana metode pengajaran, fasilitas bengkel, dan apakah materi membantu kesiapan kerja Anda..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Saran & Masukan untuk Solo Technopark / Mitra</Label>
                      <textarea 
                        rows={2}
                        value={formData.suggestions}
                        onChange={e => setFormData({ ...formData, suggestions: e.target.value })}
                        placeholder="Apa yang perlu diperbaiki atau ditambah untuk angkatan berikutnya..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <input 
                        type="checkbox"
                        id="recommendCheck"
                        checked={formData.isRecommended}
                        onChange={e => setFormData({ ...formData, isRecommended: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <label htmlFor="recommendCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                        Saya merekomendasikan program pelatihan ini kepada rekan / calon peserta lain.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsReviewModalOpen(false)}
                    className="rounded-xl font-bold text-xs"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 shadow-md"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />}
                    Kirim Ulasan Sekarang
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SectionContainer>
  );
}

