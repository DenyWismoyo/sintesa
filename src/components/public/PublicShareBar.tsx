'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getActiveRefCode } from '@/components/common/AffiliateTracker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface PublicShareBarProps {
  title: string;
  description?: string;
  url?: string;
  variant?: 'button' | 'pill' | 'icon';
  label?: string;
  className?: string;
}

export function PublicShareBar({
  title,
  description = 'Temukan program dan layanan inovasi terbaik di Solo Technopark.',
  url,
  variant = 'pill',
  label = 'Bagikan',
  className = '',
}: PublicShareBarProps) {
  const [copied, setCopied] = useState(false);

  // Buat URL share dengan melampirkan kode referral aktif jika ada
  const getShareUrl = () => {
    if (typeof window === 'undefined') return url || '';
    const targetUrl = new URL(url || window.location.href);
    const refCode = getActiveRefCode();
    if (refCode && !targetUrl.searchParams.has('ref')) {
      targetUrl.searchParams.set('ref', refCode);
    }
    return targetUrl.toString();
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: `${title} - ${description}`,
          url: shareUrl,
        });
        toast.success('Berhasil dibagikan!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Native share failed or cancelled');
        }
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Tautan berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Gagal menyalin tautan.');
    }
  };

  const shareUrl = getShareUrl();
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title}\n\n${description}\n`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };

  // Render trigger button berdasarkan variant
  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <button
          type="button"
          className={`w-9 h-9 rounded-full bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center shadow-2xs active:scale-95 transition-all ${className}`}
          aria-label="Bagikan konten ini"
        >
          <Share2 size={15} />
        </button>
      );
    }

    if (variant === 'button') {
      return (
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all ${className}`}
        >
          <Share2 size={14} />
          <span>{label}</span>
        </button>
      );
    }

    // Default: 'pill'
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs active:scale-95 transition-all ${className}`}
      >
        <Share2 size={13} className="text-slate-500" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {renderTrigger()}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-100 z-50">
        {/* Tombol Native Share (Khusus Mobile jika didukung) */}
        {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
          <>
            <DropdownMenuItem
              onClick={handleNativeShare}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <Share2 size={14} className="text-indigo-600" />
              <span>Bagikan Lewat Aplikasi...</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
          </>
        )}

        {/* WhatsApp */}
        <DropdownMenuItem asChild>
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
          >
            <MessageCircle size={14} className="text-emerald-600" />
            <span>WhatsApp</span>
          </a>
        </DropdownMenuItem>

        {/* LinkedIn */}
        <DropdownMenuItem asChild>
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <ExternalLink size={14} className="text-blue-600" />
            <span>LinkedIn</span>
          </a>
        </DropdownMenuItem>

        {/* Twitter / X */}
        <DropdownMenuItem asChild>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <span className="font-mono text-xs font-black text-slate-900 w-3.5 text-center">𝕏</span>
            <span>Twitter / X</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        {/* Salin Tautan */}
        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          {copied ? (
            <Check size={14} className="text-emerald-600" />
          ) : (
            <Copy size={14} className="text-slate-500" />
          )}
          <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PublicShareBar;

