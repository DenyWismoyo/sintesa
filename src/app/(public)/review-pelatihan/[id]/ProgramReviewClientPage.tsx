// Lokasi file: src/app/(public)/review-pelatihan/[id]/ProgramReviewClientPage.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import SectionContainer from '@/components/ui/SectionContainer';
import { 
  TrainingReviewProgram, 
  TrainingReviewItem, 
  ReviewerRole, 
  REVIEWER_ROLE_LABELS, 
  REVIEWER_ROLE_BADGES,
  ReviewAspect
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
  ThumbsDown,
  MessageSquareQuote, 
  Plus, 
  Filter, 
  ArrowRight, 
  Send, 
  Loader2, 
  ShieldCheck, 
  HelpCircle, 
  Award,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  MessageCircle,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DEFAULT_SMK_GO_GLOBAL_PROGRAM } from '@/services/learningReview.service';

interface ProgramReviewClientPageProps {
  programId?: string;
}

export default function ProgramReviewClientPage({ programId }: ProgramReviewClientPageProps) {
  const routeParams = useParams();
  const rawId = programId || (routeParams?.id as string) || '';
  const effectiveProgramId = rawId ? decodeURIComponent(rawId).trim() : 'smk-go-global-welder-2026';

  const [program, setProgram] = useState<TrainingReviewProgram | null>(null);
  const [reviews, setReviews] = useState<TrainingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Share States
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State (Inline Form - Tanpa Modal)
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  
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

  // Filter Ulasan Publik
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  // State liked reviews local
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // 1. Fetch Program Data by ID/Slug (Dengan Fail-Safe Fallback SMK Go Global)
  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      try {
        const prog = await learningReviewService.getReviewProgramById(effectiveProgramId);
        const targetProg = prog || DEFAULT_SMK_GO_GLOBAL_PROGRAM;
        setProgram(targetProg);

        // Inisialisasi aspect ratings
        const initialAspects: Record<string, number> = {};
        targetProg.aspects?.forEach(asp => {
          initialAspects[asp.id] = 5;
        });
        setFormData(prev => ({
          ...prev,
          aspectRatings: initialAspects,
        }));

        // Fetch ulasan program
        fetchProgramReviews(targetProg.id);
      } catch (err) {
        console.error('Error fetching program:', err);
        setProgram(DEFAULT_SMK_GO_GLOBAL_PROGRAM);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [effectiveProgramId]);

  // Fetch Reviews
  const fetchProgramReviews = async (id: string) => {
    setLoadingReviews(true);
    try {
      const revs = await learningReviewService.getProgramReviews(id, 'PUBLISHED');
      setReviews(revs);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Helper URL & Share
  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href.split('#')[0];
  };

  const handleCopyLink = async () => {
    const url = getDirectUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast.success('Tautan ulasan disalin!', {
        description: 'Tautan langsung ke form ulasan program ini siap dibagikan ke peserta/mentor.',
      });
    } catch {
      toast.error('Gagal menyalin tautan.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!program) return;
    const url = getDirectUrl();
    const text = `Halo rekan peserta & instruktur, yuk berikan ulasan dan evaluasi mutu untuk pelatihan *${program.title}* di Solo Technopark. Pengisian mudah, cepat, dan bisa anonim melalui tautan resmi berikut:\n\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Handler Kirim Review Publik (Inline Form)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    if (!formData.isAnonymous && !formData.reviewerName.trim()) {
      toast.error('Mohon isi nama Anda jika tidak memilih opsi anonim.');
      return;
    }
    if (!formData.headline.trim()) {
      toast.error('Mohon isi judul ringkasan ulasan Anda.');
      return;
    }
    if (!formData.feedback.trim() || formData.feedback.trim().length < 10) {
      toast.error('Ulasan pengalaman minimal 10 karakter agar informatif.');
      return;
    }

    setIsSubmitting(true);
    try {
      await learningReviewService.submitPublicReview({
        programId: program.id,
        programTitle: program.title,
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

      setSubmittedSuccess(true);
      toast.success('Ulasan Anda Berhasil Terkirim!', {
        description: 'Terima kasih atas kontribusi nyata Anda untuk kemajuan vokasi di Solo Technopark.',
      });

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

      // Refresh data program & ulasan
      const [updatedProg, updatedRevs] = await Promise.all([
        learningReviewService.getReviewProgramById(program.id),
        learningReviewService.getProgramReviews(program.id, 'PUBLISHED'),
      ]);
      if (updatedProg) setProgram(updatedProg);
      setReviews(updatedRevs);

      // Scroll ke ulasan
      setTimeout(() => {
        const ulasanSec = document.getElementById('daftar-ulasan');
        if (ulasanSec) {
          ulasanSec.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Like
  const handleLike = async (revId: string) => {
    if (likedReviews.has(revId)) return;
    setLikedReviews(prev => new Set(prev).add(revId));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r));
    await learningReviewService.likeReview(revId);
    toast.success('Terima kasih atas apresiasi Anda!');
  };

  // Filter Ulasan
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchRole = filterRole === 'ALL' || rev.reviewerRole === filterRole;
      const matchRating = filterRating === 'ALL' || Math.round(rev.overallRating).toString() === filterRating;
      return matchRole && matchRating;
    });
  }, [reviews, filterRole, filterRating]);

  // Loading State
  if (loading) {
    return (
      <SectionContainer accent="emerald" width="default" className="py-16 text-center">
        <div className="max-w-md mx-auto p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <Loader2 className="w-9 h-9 animate-spin text-emerald-600 mx-auto" />
          <h3 className="font-black text-slate-800 text-lg">Memuat Halaman Ulasan...</h3>
          <p className="text-xs text-slate-500 font-medium">
            Menyiapkan informasi program pelatihan dan formulir evaluasi vokasi.
          </p>
        </div>
      </SectionContainer>
    );
  }

  // Not Found State
  if (!program) {
    return (
      <SectionContainer accent="emerald" width="default" className="py-16 text-center">
        <div className="max-w-md mx-auto p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-black text-slate-900 text-xl">Program Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Program pelatihan yang Anda cari mungkin telah diarsipkan atau tautan yang Anda masukkan salah.
          </p>
          <div className="pt-2">
            <Link
              href="/review-pelatihan"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 h-10 transition-colors"
            >
              <ArrowLeft size={14} className="mr-2" /> Lihat Semua Program Pelatihan
            </Link>
          </div>
        </div>
      </SectionContainer>
    );
  }

  const recommendPercent = reviews.length > 0
    ? Math.round((reviews.filter(r => r.isRecommended).length / reviews.length) * 100)
    : 100;

  return (
    <SectionContainer accent="emerald" width="default" className="py-8 sm:py-12">
      {/* 1. TOP NAV / BREADCRUMB */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/review-pelatihan"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-all hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          <span>Lihat Semua Program Pelatihan</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
            className="rounded-xl h-9 text-xs font-bold bg-white border-slate-200 hover:bg-slate-50 hover:text-emerald-700 shadow-2xs"
          >
            {copiedLink ? <Check size={14} className="mr-1.5 text-emerald-600" /> : <Copy size={14} className="mr-1.5" />}
            {copiedLink ? 'Tersalin!' : 'Salin Tautan'}
          </Button>

          <Button
            onClick={handleShareWhatsApp}
            size="sm"
            className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          >
            <MessageCircle size={14} className="mr-1.5" /> Bagikan WhatsApp
          </Button>
        </div>
      </div>

      {/* 2. PROGRAM HERO & HEADER */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black tracking-wide border border-emerald-500/30 backdrop-blur-md">
              <Sparkles size={13} className="text-emerald-400" /> {program.category}
            </span>
            {program.partnerInstitution && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black tracking-wide border border-amber-500/30 backdrop-blur-md">
                Mitra: {program.partnerInstitution}
              </span>
            )}
            <span className="text-xs font-bold text-slate-300 px-2 py-1">
              {program.batch} • {program.year}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {program.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-3xl">
            {program.shortDescription}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#form-ulasan"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm px-6 h-11 shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Plus size={16} className="mr-2" /> Isi Formulir Ulasan Sekarang
            </a>
            <a
              href="#daftar-ulasan"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 h-11 border border-white/15 backdrop-blur-md transition-colors"
            >
              <span>Baca {reviews.length} Ulasan Terbit</span>
              <ArrowRight size={15} className="ml-2" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. PROGRAM BANNER & STATISTIK ASPEK */}
      <div className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Kolom Kiri: Banner / Ringkasan Program */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
            <div className="space-y-4">
              {program.imageUrl && (
                <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                  <img 
                    src={program.imageUrl} 
                    alt={program.title} 
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-bold">
                    Solo Technopark × {program.partnerInstitution || 'Vokasi Indonesia'}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div>🏢 <strong>Penyelenggara:</strong> {program.organizer}</div>
                <div>🎯 <strong>Sasaran Peserta:</strong> {program.targetAudience}</div>
                <div>✅ <strong>Status Review:</strong> Dibuka untuk Umum & Anonim</div>
              </div>
            </div>

            {/* Skor Global */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indeks Kepuasan</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">{program.stats?.averageRating || 0}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={16} 
                        className={s <= Math.round(program.stats?.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {program.stats?.totalReviews || 0} ulasan terverifikasi • {recommendPercent}% merekomendasikan
                </p>
              </div>

              <a
                href="#form-ulasan"
                className="inline-flex items-center rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 transition-colors"
              >
                <Plus size={14} className="mr-1.5" /> Beri Nilai
              </a>
            </div>
          </div>

          {/* Kolom Kanan: Evaluasi Aspek Kunci Program */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award size={18} className="text-emerald-600" /> Kriteria Evaluasi Program Ini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Poin-poin evaluasi berikut ditetapkan pengelola untuk mengukur kepuasan pelatihan:
              </p>
            </div>

            <div className="space-y-4">
              {program.aspects?.map((aspect) => {
                const score = program.stats?.aspectScores?.[aspect.id] || program.stats?.averageRating || 0;
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
                      <span className="font-mono font-bold text-emerald-700">
                        {score > 0 ? score.toFixed(1) : '-'}/5.0
                      </span>
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

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>
                Evaluasi diisi langsung oleh peserta, alumni, instruktur, dan industri pengguna lulusan.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INLINE REVIEW FORM (FOKUS 1 HALAMAN TANPA MODAL) */}
      <div 
        id="form-ulasan" 
        ref={formRef}
        className="mb-14 bg-white rounded-3xl border-2 border-emerald-500/30 shadow-md p-6 sm:p-10 scroll-mt-6"
      >
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-2">
            <Plus size={13} /> Formulir Ulasan Langsung
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tulis Ulasan & Evaluasi: {program.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1 leading-relaxed">
            Suara Anda sangat berarti untuk transparansi dan mutu vokasi. Pengisian mudah, cepat, tanpa wajib login, dan nama otomatis disamarkan (anonim-first).
          </p>
        </div>

        {submittedSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-black text-sm">Ulasan Anda Berhasil Ditambahkan!</p>
              <p className="text-emerald-700">Terima kasih atas kontribusi Anda. Ulasan telah diterbitkan di bawah.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitReview} className="space-y-8">
          {/* BAGIAN 1: IDENTITAS & PRIVASI ANONIM */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Identitas & Peran Anda
            </h3>

            {/* Peran Pengulas Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                Pilih Peran Anda dalam Program Pelatihan Ini: <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['PESERTA', 'MENTOR', 'INDUSTRI', 'PUBLIK'] as ReviewerRole[]).map((role) => {
                  const isSelected = formData.reviewerRole === role;
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setFormData({ ...formData, reviewerRole: role })}
                      className={`p-3 rounded-2xl text-xs font-bold text-left border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{role === 'PESERTA' ? '🎓' : role === 'MENTOR' ? '👨‍🏫' : role === 'INDUSTRI' ? '🏭' : '👥'}</span>
                        {isSelected && <Check size={14} className="text-emerald-600" />}
                      </div>
                      <div className="font-black leading-snug">{REVIEWER_ROLE_LABELS[role]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opsi Anonim Toggle */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  Kirim Ulasan Secara Anonim (Disarankan demi Kebebasan Berpendapat)
                </span>
              </label>
              <p className="text-[11px] text-emerald-800 pl-7 leading-relaxed font-normal">
                {formData.isAnonymous ? (
                  <>✓ Nama Anda otomatis disamarkan secara terstruktur (contoh: <em>Peserta Welder • Anonim</em>). Privasi Anda terjaga 100%.</>
                ) : (
                  <>Nama asli dan instansi Anda akan ditampilkan secara terbuka di halaman publik.</>
                )}
              </p>
            </div>

            {/* Nama & Instansi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  {formData.isAnonymous ? 'Nama Panggilan / Samaran (Opsional)' : 'Nama Lengkap Anda *'}
                </Label>
                <Input 
                  value={formData.reviewerName}
                  onChange={e => setFormData({ ...formData, reviewerName: e.target.value })}
                  placeholder={formData.isAnonymous ? 'Boleh dikosongkan (Otomatis Anonim)' : 'Contoh: Ahmad Fauzi'}
                  className="h-10 rounded-xl text-xs bg-slate-50/50"
                  required={!formData.isAnonymous}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Asal Sekolah / Lembaga / Perusahaan (Opsional)</Label>
                <Input 
                  value={formData.reviewerInstitution}
                  onChange={e => setFormData({ ...formData, reviewerInstitution: e.target.value })}
                  placeholder="Contoh: SMK N Kendal / PT Tri Ratna Diesel"
                  className="h-10 rounded-xl text-xs bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN 2: PENILAIAN BINTANG & KRITERIA ASPEK */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              2. Penilaian Mutu & Skor Kepuasan
            </h3>

            {/* Nilai Bintang Keseluruhan */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Rating Keseluruhan Program Pelatihan: <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-slate-500 font-medium">Seberapa puas Anda terhadap keseluruhan program ini?</p>
                </div>
                <span className="text-sm font-black text-emerald-700 font-mono">
                  {formData.overallRating} dari 5 Bintang
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFormData({ ...formData, overallRating: star })}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star 
                      size={32} 
                      className={star <= formData.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Penilaian per Aspek Kustom */}
            {program.aspects && program.aspects.length > 0 && (
              <div className="space-y-4">
                <Label className="text-xs font-bold text-slate-700">
                  Nilai Setiap Aspek Pelatihan (1 - 5 Bintang):
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {program.aspects.map((aspect) => {
                    const currentScore = formData.aspectRatings[aspect.id] || 5;
                    return (
                      <div 
                        key={aspect.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 max-w-[240px]">
                          <div className="text-xs font-black text-slate-800">{aspect.label}</div>
                          {aspect.description && (
                            <div className="text-[10px] text-slate-400 leading-tight">{aspect.description}</div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  aspectRatings: {
                                    ...formData.aspectRatings,
                                    [aspect.id]: star,
                                  }
                                });
                              }}
                              className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star 
                                size={18} 
                                className={star <= currentScore ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rekomendasi Pelatihan */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-800">
                  Apakah Anda merekomendasikan program pelatihan ini kepada rekan lain?
                </Label>
                <p className="text-[11px] text-slate-500">Membantu calon peserta lain menentukan pilihan vokasi.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={formData.isRecommended ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, isRecommended: true })}
                  className={`rounded-xl text-xs font-bold ${
                    formData.isRecommended ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white'
                  }`}
                >
                  <ThumbsUp size={13} className="mr-1.5" /> Ya, Rekomendasikan
                </Button>
                <Button
                  type="button"
                  variant={!formData.isRecommended ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, isRecommended: false })}
                  className={`rounded-xl text-xs font-bold ${
                    !formData.isRecommended ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  <ThumbsDown size={13} className="mr-1.5" /> Tidak
                </Button>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: TESTIMONI & MASUKAN DETAIL */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              3. Ulasan Pengalaman & Saran Konstruktif
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Judul Ringkasan Ulasan Anda <span className="text-red-500">*</span>
              </Label>
              <Input 
                required
                value={formData.headline}
                onChange={e => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Contoh: Pelatihan Sangat Intensif, Peralatan Las Sesuai Standar Industri Luar Negeri"
                className="h-10 rounded-xl text-xs bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Ceritakan Pengalaman & Penilaian Anda <span className="text-red-500">*</span>
              </Label>
              <textarea 
                required
                rows={4}
                value={formData.feedback}
                onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Bagikan bagaimana proses bimbingan instruktur, ketersediaan alat praktik pengelasan, kedisiplinan bengkel, serta materi yang diajarkan..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
              />
              <p className="text-[10px] text-slate-400">Minimal 10 karakter.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Saran untuk Peningkatan Program Ini (Opsional)
              </Label>
              <textarea 
                rows={2}
                value={formData.suggestions}
                onChange={e => setFormData({ ...formData, suggestions: e.target.value })}
                placeholder="Misal: Penambahan jam terbang praktik malam hari, modul keselamatan kerja diperbanyak..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* TOMBOL SUBMIT */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              Dengan mengirim ulasan, Anda menyetujui evaluasi objektif demi transparansi BLUD Solo Technopark.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm px-8 h-11 shadow-md hover:shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Mengirim Ulasan...
                </>
              ) : (
                <>
                  <Send size={15} className="mr-2" />
                  Kirim Ulasan Sekarang
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 5. DAFTAR ULASAN YANG SUDAH TERBIT KHUSUS PROGRAM INI */}
      <div id="daftar-ulasan" className="space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquareQuote className="text-emerald-600" />
              Ulasan Terverifikasi ({reviews.length})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Transparansi suara nyata dari peserta, instruktur, dan mitra industri program {program.title}.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Peran</option>
              <option value="PESERTA">Peserta / Alumni</option>
              <option value="MENTOR">Instruktur / Mentor</option>
              <option value="INDUSTRI">Mitra Industri</option>
              <option value="PUBLIK">Masyarakat Umum</option>
            </select>

            <select
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Bintang</option>
              <option value="5">Bintang 5</option>
              <option value="4">Bintang 4</option>
              <option value="3">Bintang 3</option>
              <option value="2">Bintang 2</option>
              <option value="1">Bintang 1</option>
            </select>
          </div>
        </div>

        {/* List Review Cards */}
        {loadingReviews ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-600 text-xs">Memuat daftar ulasan...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <MessageSquareQuote className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-black text-slate-700 text-sm">Belum Ada Ulasan yang Sesuai Filter</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Jadilah yang pertama memberikan ulasan objektif untuk pelatihan ini melalui formulir di atas!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((rev) => (
              <div 
                key={rev.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header Ulasan */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      REVIEWER_ROLE_BADGES[rev.reviewerRole as ReviewerRole] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {REVIEWER_ROLE_LABELS[rev.reviewerRole as ReviewerRole] || rev.reviewerRole}
                    </span>
                    <span className="text-xs font-bold text-slate-300">•</span>
                    <span className="text-xs font-black text-slate-900">{rev.reviewerName}</span>
                    {rev.reviewerInstitution && (
                      <span className="text-xs text-slate-500 font-medium">({rev.reviewerInstitution})</span>
                    )}
                    {rev.isAnonymous && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        <ShieldCheck size={11} /> Anonim Terverifikasi
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Rating & Judul */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={15} 
                          className={star <= rev.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
                        />
                      ))}
                    </div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">{rev.headline}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100 font-normal">
                    "{rev.feedback}"
                  </p>
                </div>

                {/* Masukan / Saran jika ada */}
                {rev.suggestions && (
                  <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200/70">
                    <span className="font-bold">Saran untuk Program:</span> {rev.suggestions}
                  </div>
                )}

                {/* Rincian Aspek Penilaian */}
                {rev.aspectRatings && Object.keys(rev.aspectRatings).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(rev.aspectRatings).map(([aspKey, score]) => (
                      <div 
                        key={aspKey}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs"
                      >
                        <span className="capitalize">{aspKey.replace(/_/g, ' ')}:</span>
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <Star size={10} className="fill-emerald-500 text-emerald-500" /> {score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tanggapan Resmi Admin jika ada */}
                {rev.adminResponse && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Tanggapan Resmi Solo Technopark:</span>
                    </div>
                    <p className="text-emerald-950 leading-relaxed font-normal">{rev.adminResponse}</p>
                  </div>
                )}

                {/* Footer Kartu & Reaksi Bermanfaat */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {rev.isRecommended && (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <ThumbsUp size={12} /> Merekomendasikan program ini
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleLike(rev.id!)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl"
                  >
                    <ThumbsUp size={13} className={`mr-1.5 ${likedReviews.has(rev.id!) ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                    <span>Membantu ({rev.likesCount || 0})</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}

