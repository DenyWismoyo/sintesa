// Lokasi file: src/app/(public)/artikel/[id]/ClientPage.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArticleDetail, useArticles } from '@/hooks/useArticles';
import { Article } from '@/types';
import SectionContainer from '@/components/ui/SectionContainer';
import { 
  ArrowLeft, Calendar, Clock, Eye, Share2, 
  Check, Copy, GraduationCap, Store, Building2, 
  MessageCircle, Sparkles, ArrowRight, Tag,
  ExternalLink, Bookmark, CheckCircle2,
  ChevronRight, Send, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface ClientPageProps {
  initialArticle: Article | null;
  idOrSlug: string;
}

export default function ArticleDetailClient({ initialArticle, idOrSlug }: ClientPageProps) {
  const router = useRouter();
  const { data: articleData, isLoading } = useArticleDetail(idOrSlug);
  
  // Gunakan initialArticle jika query masih fetching
  const article = articleData || initialArticle;

  // Query artikel terkait (kategori yang sama)
  const { articles: relatedArticles = [] } = useArticles({ 
    publishedOnly: true, 
    category: article?.category,
    maxLimit: 4
  });

  const [copied, setCopied] = useState(false);

  // Perhitungan estimasi waktu baca
  const readingTime = React.useMemo(() => {
    if (!article?.content) return 2;
    const words = article.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [article?.content]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Tautan Disalin!", { description: "Link artikel berhasil disalin ke clipboard." });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWa = () => {
    if (typeof window !== 'undefined' && article) {
      const text = `Baca artikel menarik ini dari Solo Technopark: "${article.title}"\n${window.location.href}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (isLoading && !article) {
    return (
      <SectionContainer accent="amber">
        <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Memuat artikel dan ulasan...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!article) {
    return (
      <SectionContainer accent="amber">
        <div className="max-w-xl mx-auto py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Artikel Tidak Ditemukan</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Artikel yang Anda tuju mungkin sudah dipindahkan, diarsipkan, atau tautannya telah kedaluwarsa.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/artikel')}
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 font-semibold shadow-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Kembali ke Katalog Artikel
          </Button>
        </div>
      </SectionContainer>
    );
  }

  // Render Smart CTA Box
  const renderSmartCta = () => {
    const cta = article.cta;
    if (!cta || cta.type === 'NONE') return null;

    if (cta.type === 'TRAINING') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-8 sm:my-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/15 border border-amber-200/80 p-4 sm:p-8 relative overflow-hidden shadow-xs sm:shadow-sm"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/15 border border-amber-300 text-amber-900 text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                <GraduationCap size={13} className="text-amber-700" />
                Program Pelatihan Terkait
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {cta.title || 'Tertarik Menguasai Keahlian di Bidang Ini?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cta.description || 'Daftarkan diri Anda atau tim ke program pelatihan intensif resmi bersertifikasi industri di Solo Technopark. Pelajari langsung dengan instruktur ahli dan peralatan standar internasional.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-amber-900/80 font-medium pt-1">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-amber-600" /> Sertifikat Resmi</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-amber-600" /> Kurikulum Industri</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-amber-600" /> Praktik Laboratorium</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2 pt-2 sm:pt-0">
              <Link 
                href={cta.targetUrl || '/program-pelatihan'}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{cta.buttonText || 'Daftar / Lihat Pelatihan'}</span>
                <ArrowRight size={15} />
              </Link>
              <Link 
                href="/program-pelatihan"
                className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
              >
                Eksplor Program Lainnya
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    if (cta.type === 'CATALOG') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-8 sm:my-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/15 border border-emerald-200/80 p-4 sm:p-8 relative overflow-hidden shadow-xs sm:shadow-sm"
        >
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-300 text-emerald-900 text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                <Store size={13} className="text-emerald-700" />
                Layanan & Produk Terkait
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {cta.title || 'Butuh Solusi Rekayasa atau Produk Ini?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cta.description || 'Pesan layanan teknologi, manufaktur presisi, prototyping, atau produk inovasi langsung melalui E-Katalog resmi Solo Technopark dengan jaminan mutu dan standar B2B/B2G.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-emerald-900/80 font-medium pt-1">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600" /> Kualitas Teruji</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600" /> Faktur & Legalitas Sah</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-600" /> Konsultasi Teknis</span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2 pt-2 sm:pt-0">
              <Link 
                href={cta.targetUrl || '/e-katalog'}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{cta.buttonText || 'Lihat Produk di E-Katalog'}</span>
                <ArrowRight size={15} />
              </Link>
              <Link 
                href="/e-katalog"
                className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
              >
                Katalog Lengkap
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    if (cta.type === 'FACILITY') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-8 sm:my-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-500/15 border border-blue-200/80 p-4 sm:p-8 relative overflow-hidden shadow-xs sm:shadow-sm"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/15 border border-blue-300 text-blue-900 text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                <Building2 size={13} className="text-blue-700" />
                Fasilitas & Lab Kawasan
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {cta.title || 'Sewa Fasilitas & Laboratorium Riset Kawasan'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cta.description || 'Solo Technopark menyediakan auditorium, ruang rapat, laboratorium permesinan, hingga studio podcast untuk menunjang kegiatan operasional bisnis dan riset Anda.'}
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              <Link 
                href={cta.targetUrl || '/fasilitas'}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{cta.buttonText || 'Cek Jadwal & Sewa Fasilitas'}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </motion.div>
      );
    }

    if (cta.type === 'WHATSAPP') {
      const waNumber = cta.targetId || '6281234567890';
      const waMessage = encodeURIComponent(`Halo Tim Solo Technopark, saya membaca artikel "${article.title}" dan ingin berkonsultasi lebih lanjut.`);
      const waUrl = cta.targetUrl || `https://wa.me/${waNumber}?text=${waMessage}`;

      return (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="my-8 sm:my-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#25D366]/10 via-emerald-500/5 to-[#25D366]/15 border border-emerald-300/80 p-4 sm:p-8 relative overflow-hidden shadow-xs sm:shadow-sm"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-950 text-[11px] sm:text-xs font-bold tracking-wide uppercase">
                <MessageCircle size={13} className="text-[#1EBE5D]" />
                Konsultasi WhatsApp Langsung
              </div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {cta.title || 'Ingin Diskusi Langsung dengan Tim Ahli Kami?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {cta.description || 'Punya kebutuhan khusus terkait materi atau layanan dalam artikel ini? Customer Support Solo Technopark siap membantu memberikan panduan dan rekomendasi terbaik.'}
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              <a 
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle size={17} />
                <span>{cta.buttonText || 'Chat WhatsApp Official'}</span>
              </a>
            </div>
          </div>
        </motion.div>
      );
    }

    // Default / Custom CTA
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="my-8 sm:my-10 rounded-2xl sm:rounded-3xl bg-slate-900 text-white p-4 sm:p-8 relative overflow-hidden shadow-xs sm:shadow-md"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-lg sm:text-2xl font-bold leading-snug">
              {cta.title || 'Pelajari Lebih Lanjut'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {cta.description || 'Kunjungi tautan berikut untuk informasi lengkap dan pendaftaran program.'}
            </p>
          </div>
          <div className="shrink-0 pt-2 sm:pt-0">
            <Link 
              href={cta.targetUrl || '#'}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{cta.buttonText || 'Buka Halaman'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  const otherArticles = relatedArticles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <SectionContainer accent="amber" containerClassName="!px-3 sm:!px-6 md:!px-8">
      <div className="max-w-4xl mx-auto pb-20 sm:pb-16">
        
        {/* Top Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <Link 
            href="/artikel" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Warta</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Link href="/" className="hover:text-slate-700">Beranda</Link>
            <ChevronRight size={12} />
            <Link href="/artikel" className="hover:text-slate-700">Artikel</Link>
            <ChevronRight size={12} />
            <span className="text-amber-800 font-semibold">{article.category}</span>
          </div>
        </div>

        {/* Article Header */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-100/90 text-amber-800 border-amber-300 font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs">
              {article.category}
            </Badge>

            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
              <Calendar size={12} className="text-slate-400" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Baru saja'}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
              <Clock size={12} className="text-slate-400" />
              {readingTime} mnt baca
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
              <Eye size={12} className="text-slate-400" />
              {article.viewCount || 1} dibaca
            </span>
          </div>

          <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.25] sm:leading-[1.15]">
            {article.title}
          </h1>

          {/* Author info & Share buttons - Borderless on mobile */}
          <div className="flex items-center justify-between gap-3 pt-3 pb-3 border-y border-slate-100 sm:border-slate-200/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {article.authorName || 'Redaksi Solo Technopark'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">Tim Riset, Pelatihan & Warta Kawasan</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button 
                onClick={handleShareWa}
                aria-label="Share ke WhatsApp"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
                title="Bagikan via WhatsApp"
              >
                <MessageCircle size={15} />
              </button>
              <button 
                onClick={handleCopyLink}
                aria-label="Salin Tautan"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 flex items-center justify-center transition-colors shadow-2xs"
                title="Salin Tautan Artikel"
              >
                {copied ? <Check size={15} className="text-amber-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Cover Image - Borderless Edge-Friendly on Mobile */}
        {article.coverImageUrl ? (
          <div className="mb-6 sm:mb-10 rounded-xl sm:rounded-3xl overflow-hidden border-0 sm:border sm:border-slate-200/80 shadow-none sm:shadow-sm aspect-video sm:aspect-21/9 relative bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={article.coverImageUrl} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-6 sm:mb-10 rounded-xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/20 border-0 sm:border sm:border-amber-200/80 text-center flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px]">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-amber-900">Solo Technopark Intelligence & Knowledge Base</p>
          </div>
        )}

        {/* Article Excerpt / Lead Paragraph - Borderless Editorial Accent (No Box Wrapper on Mobile) */}
        {article.excerpt && (
          <div className="mb-6 sm:mb-8 pl-3.5 pr-1 py-1 sm:p-5 border-l-4 border-amber-500 sm:border sm:border-amber-200/60 bg-transparent sm:bg-amber-50/50 rounded-none sm:rounded-2xl">
            <p className="text-sm sm:text-lg font-medium text-slate-700 leading-relaxed italic">
              &ldquo;{article.excerpt}&rdquo;
            </p>
          </div>
        )}

        {/* Main Body Content (GitHub-style Markdown) - 100% Borderless & Full Width on Mobile */}
        <div className="bg-transparent sm:bg-white p-0 sm:p-10 rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/80 shadow-none sm:shadow-2xs my-4 sm:my-6">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-6 pt-4 sm:mt-8 sm:pt-6 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Tag size={13} className="text-slate-400 mr-1" />
            {article.tags.map((t, i) => (
              <span 
                key={i} 
                className="text-[11px] sm:text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Embedded Smart CTA Banner */}
        {renderSmartCta()}

        {/* Seksi Rekomendasi Artikel Terkait */}
        {otherArticles.length > 0 && (
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Artikel Terkait Lainnya
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-500">
                  Baca ulasan dan kabar seputar {article.category}
                </p>
              </div>
              <Link 
                href="/artikel" 
                className="text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
              >
                Lihat Semua <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
              {otherArticles.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/artikel/${item.slug || item.id}`}
                  className="group flex flex-col rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 p-3 sm:p-4 shadow-2xs hover:shadow-md transition-all duration-200"
                >
                  <div className="w-full aspect-video rounded-lg sm:rounded-xl bg-slate-100 overflow-hidden mb-2.5 sm:mb-3 relative">
                    {item.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.coverImageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50/60 text-amber-600 font-bold text-xs">
                        Solo Technopark
                      </div>
                    )}
                  </div>
                  <Badge className="w-fit text-[10px] bg-slate-100 text-slate-700 border-none font-semibold mb-1.5 sm:mb-2">
                    {item.category}
                  </Badge>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed mt-auto pt-1 sm:pt-2">
                    {item.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Mobile Sticky Quick CTA Bar (Bila Artikel memiliki CTA aktif) */}
      {article.cta && article.cta.type !== 'NONE' && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 sm:hidden flex items-center justify-between gap-3 shadow-lg">
          <div className="truncate">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">
              {article.cta.type === 'TRAINING' ? '🎓 Info Pelatihan' :
               article.cta.type === 'CATALOG' ? '🛒 E-Katalog' :
               article.cta.type === 'FACILITY' ? '🏢 Fasilitas' : '💬 Konsultasi'}
            </p>
            <p className="text-xs font-semibold text-slate-800 truncate">
              {article.cta.title || article.title}
            </p>
          </div>
          <Link
            href={
              article.cta.type === 'WHATSAPP' 
                ? (article.cta.targetUrl || `https://wa.me/${article.cta.targetId || '6281234567890'}`)
                : (article.cta.targetUrl || '/program-pelatihan')
            }
            target={article.cta.type === 'WHATSAPP' ? '_blank' : '_self'}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
          >
            <span>{article.cta.buttonText || 'Aksi Sekarang'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </SectionContainer>
  );
}
