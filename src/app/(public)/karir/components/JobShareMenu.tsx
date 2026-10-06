// src/app/(public)/karir/components/JobShareMenu.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Check,
  Copy,
  MessageCircle,
  Twitter,
  Linkedin,
  FileText,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { JobListing } from '@/types/job.types';
import { formatSalary } from '@/utils/format';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobShareMenuProps {
  job: JobListing;
  variant?: 'button' | 'inline-bar' | 'compact-icon';
  className?: string;
}

/**
 * Format teks broadcast WhatsApp & Medsos profesional dan menarik
 */
export function generateJobShareText(job: JobListing, url: string): string {
  const formattedSalary = !job.salary.isDisclosed
    ? 'Gaji Kompetitif (Dirahasiakan)'
    : job.salary.min && job.salary.max
    ? `${formatSalary(job.salary.min, job.salary.currency || 'IDR')} - ${formatSalary(job.salary.max, job.salary.currency || 'IDR')} / ${job.salary.period}`
    : job.salary.min
    ? `Mulai ${formatSalary(job.salary.min, job.salary.currency || 'IDR')} / ${job.salary.period}`
    : 'Gaji Negosiabel';

  const kurikulumSection =
    job.relevantTrainingPrograms.length > 0
      ? `\n🎓 *Kurikulum Selaras STP*:\n${job.relevantTrainingPrograms
          .slice(0, 3)
          .map((p) => `• ${p}`)
          .join('\n')}\n`
      : '';

  const skillsSection =
    job.skills.length > 0
      ? `\n🛠️ *Keahlian Dibutuhkan*: ${job.skills.slice(0, 5).join(', ')}\n`
      : '';

  const partnerBadge =
    job.companyType === 'Mitra Industri STP'
      ? ' ⭐ Mitra Resmi Solo Technopark'
      : job.companyType === 'BUMN & Pemerintah'
      ? ' 🏛️ BUMN / Instansi Pemerintah'
      : '';

  return (
    `🚀 *LOWONGAN KERJA RESMI — SOLO TECHNOPARK*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📌 *Posisi*: ${job.title}\n` +
    `🏢 *Perusahaan*: ${job.company}${partnerBadge}\n` +
    `📍 *Penempatan*: ${job.location}\n` +
    `💼 *Status*: ${job.workType} (${job.workSetup})\n` +
    `⏳ *Pengalaman*: ${job.experienceLevel}\n` +
    `💰 *Estimasi Gaji*: ${formattedSalary}\n` +
    kurikulumSection +
    skillsSection +
    `\n📝 *Rincian Lengkap & Lamar Langsung*:\n` +
    `👉 ${url}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Bursa Karir & Talenta Vokasi — Solo Technopark`
  );
}

export default function JobShareMenu({
  job,
  variant = 'button',
  className = '',
}: JobShareMenuProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(`${window.location.origin}/karir/${job.id}`);
    }
  }, [job.id]);

  const shareText = generateJobShareText(job, currentUrl);

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      toast.success('Tautan lowongan berhasil disalin!', {
        description: 'Tautan siap dibagikan ke media sosial atau perpesanan.',
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error('Gagal menyalin tautan.');
    }
  };

  const handleCopyFormattedText = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage(true);
      toast.success('Format pesan WhatsApp berhasil disalin!', {
        description: 'Format copywriting rapi lengkap siap di-paste di grup WhatsApp atau Telegram.',
      });
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      toast.error('Gagal menyalin pesan.');
    }
  };

  const handleShareWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(liUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tweetText = `Lowongan ${job.title} di ${job.company} (${job.location}) via Bursa Karir Solo Technopark.`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} di ${job.company}`,
          text: shareText,
          url: currentUrl,
        });
      } catch {
        // Abaikan jika dibatalkan oleh pengguna
      }
    } else {
      handleCopyLink();
    }
  };

  // ─── Tampilan 1: Inline Bar (Cocok untuk Banner / Footer) ───
  if (variant === 'inline-bar') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Share2 size={13} /> Bagikan:
        </span>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/60 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
          title="Bagikan ke WhatsApp"
        >
          <MessageCircle size={15} />
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={handleShareLinkedIn}
          className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white border border-sky-200/60 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
          title="Bagikan ke LinkedIn"
        >
          <Linkedin size={15} />
        </button>

        {/* Twitter / X */}
        <button
          type="button"
          onClick={handleShareTwitter}
          className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
          title="Bagikan ke X"
        >
          <Twitter size={14} />
        </button>

        {/* Salin Format Pesan Lengkap */}
        <button
          type="button"
          onClick={handleCopyFormattedText}
          className={`h-9 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border ${
            copiedMessage
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Salin Format Pesan Lengkap WA"
        >
          {copiedMessage ? <Check size={13} /> : <FileText size={13} />}
          <span>{copiedMessage ? 'Pesan Disalin' : 'Format WA'}</span>
        </button>

        {/* Salin Tautan Saja */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`h-9 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border ${
            copiedLink
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
          title="Salin Tautan"
        >
          {copiedLink ? <Check size={13} /> : <Copy size={13} />}
          <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
        </button>
      </div>
    );
  }

  // ─── Tampilan 2: Compact Icon (Untuk Kartu Lowongan) ───
  if (variant === 'compact-icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            title="Bagikan Lowongan"
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${className}`}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-68 p-2 rounded-2xl shadow-xl border border-slate-200 bg-white"
        >
          <DropdownMenuLabel className="px-3 py-1.5">
            <span className="text-xs font-extrabold text-slate-900 block truncate">
              {job.title}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{job.company}</span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1 border-slate-100" />

          <DropdownMenuItem
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-emerald-50 text-xs font-bold text-emerald-700"
          >
            <MessageCircle size={15} className="text-emerald-600" />
            <span>Bagikan ke WhatsApp</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCopyFormattedText}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            {copiedMessage ? <Check size={15} className="text-emerald-600" /> : <FileText size={15} className="text-slate-500" />}
            <span>Salin Format Pesan WA</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCopyLink}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-slate-500" />}
            <span>Salin Tautan Lowongan</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleShareLinkedIn}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-sky-50 text-xs font-bold text-sky-700"
          >
            <Linkedin size={15} className="text-sky-600" />
            <span>Bagikan ke LinkedIn</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ─── Tampilan 3: Button Dropdown (Default untuk Header / Detail Page) ───
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-10 px-4 text-xs font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 gap-2 shadow-2xs ${className}`}
        >
          <Share2 className="w-4 h-4 text-slate-500" />
          <span>Bagikan</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-2.5 rounded-3xl shadow-2xl border border-slate-200/90 bg-white space-y-1"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Sparkles size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider">
              Bagikan Lowongan Kerja
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 line-clamp-1">{job.title}</p>
          <p className="text-[11px] text-slate-500 font-medium">{job.company} • {job.location}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        {/* WhatsApp Share Button */}
        <DropdownMenuItem
          onClick={handleShareWhatsApp}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-emerald-50 text-xs font-bold text-emerald-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageCircle size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-bold">Kirim ke WhatsApp</span>
            <span className="text-[10px] text-slate-400 font-normal">Format pesan lengkap & rapi</span>
          </div>
        </DropdownMenuItem>

        {/* Copy Formatted WhatsApp Message */}
        <DropdownMenuItem
          onClick={handleCopyFormattedText}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            {copiedMessage ? <Check size={16} className="text-emerald-600" /> : <FileText size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-bold">{copiedMessage ? 'Pesan Berhasil Disalin!' : 'Salin Format Pesan WA'}</span>
            <span className="text-[10px] text-slate-400 font-normal">Siap dipaste di grup WA/Telegram</span>
          </div>
        </DropdownMenuItem>

        {/* Copy Link Only */}
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-bold">{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Saja'}</span>
            <span className="text-[10px] text-slate-400 font-normal">URL halaman detail lowongan</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        {/* Social Options (LinkedIn & Twitter) */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 px-1">
          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="flex items-center justify-center gap-1.5 h-8.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors"
          >
            <Linkedin size={13} />
            <span>LinkedIn</span>
          </button>

          <button
            type="button"
            onClick={handleShareTwitter}
            className="flex items-center justify-center gap-1.5 h-8.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <Twitter size={13} />
            <span>X / Twitter</span>
          </button>
        </div>

        {/* Mobile Native Share Trigger jika didukung */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <div className="pt-1 px-1">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-1.5 h-8.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Smartphone size={13} />
              <span>Buka Menu Berbagi Ponsel</span>
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
