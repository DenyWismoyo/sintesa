'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useAffiliateProfile } from '@/hooks/useAffiliate';
import { Share2, Check, Copy, MessageCircle, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface AffiliateShareButtonProps {
  path: string; // e.g. "/program-pelatihan/react-mastery"
  title: string;
  description?: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export function AffiliateShareButton({
  path,
  title,
  description,
  className = '',
  variant = 'outline',
  size = 'md',
}: AffiliateShareButtonProps) {
  const { user } = useAuth();
  const { profile } = useAffiliateProfile(user?.uid);
  const isApproved = profile?.status === 'APPROVED';
  const affiliate = profile;
  const [copied, setCopied] = useState(false);

  // Bangun URL lengkap
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sintesa.solotechnopark.id';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const shareUrl = isApproved && affiliate?.referralCode
    ? `${origin}${cleanPath}?ref=${affiliate.referralCode}`
    : `${origin}${cleanPath}`;

  const shareText = `${title}\n${description ? description.slice(0, 100) + '...\n' : ''}Cek selengkapnya di: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(
        isApproved
          ? 'Link referral berhasil disalin!'
          : 'Link berhasil disalin!',
        {
          description: isApproved
            ? `Kode ${affiliate?.referralCode} telah tertaut. Komisi akan otomatis masuk jika ada transaksi.`
            : 'Siap dibagikan ke rekan atau media sosial.',
        }
      );
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      toast.error('Gagal menyalin link.');
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const isSmall = size === 'sm';

  const baseStyles = isSmall
    ? 'px-3 py-1.5 text-xs rounded-xl font-bold'
    : 'px-4 py-2.5 text-sm rounded-2xl font-bold';

  let variantStyles = 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300';
  if (variant === 'primary') {
    variantStyles = isApproved
      ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm';
  } else if (variant === 'subtle') {
    variantStyles = isApproved
      ? 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none ${baseStyles} ${variantStyles} ${className}`}
        >
          {isApproved ? (
            <>
              <Sparkles className={isSmall ? 'w-3.5 h-3.5 text-violet-400' : 'w-4 h-4 text-violet-400'} />
              <span>Bagikan (Link Mitra)</span>
            </>
          ) : (
            <>
              <Share2 className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>Bagikan</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-xl border border-slate-200">
        <DropdownMenuLabel className="px-3 py-2">
          {isApproved ? (
            <div className="flex items-center gap-2 text-violet-700">
              <Sparkles size={16} className="text-violet-600 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Mitra Afiliasi Aktif</p>
                <p className="text-[11px] font-medium text-slate-500">Ref: <span className="font-bold text-violet-600">{affiliate?.referralCode}</span></p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-slate-800">Bagikan Halaman</p>
              <p className="text-[11px] font-normal text-slate-500">Bagikan informasi ini ke jejaring Anda</p>
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 border-slate-100" />

        <DropdownMenuItem
          onClick={handleCopyLink}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-700"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-slate-500" />}
          <span>{copied ? 'Link Disalin!' : 'Salin Tautan'}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleShareWhatsApp}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-50 text-xs font-bold text-emerald-700"
        >
          <MessageCircle size={16} className="text-emerald-600" />
          <span>Bagikan ke WhatsApp</span>
        </DropdownMenuItem>

        {!isApproved && (
          <>
            <DropdownMenuSeparator className="my-1 border-slate-100" />
            <div className="p-2.5 bg-violet-50/70 rounded-xl mt-1">
              <p className="text-[11px] font-bold text-violet-900 leading-tight">Ingin komisi dari link ini?</p>
              <p className="text-[10px] text-violet-700 mt-0.5 leading-snug">
                Daftar program mitra dan dapatkan bagi hasil 5% untuk setiap transaksi yang Anda referensikan.
              </p>
              <Link
                href="/profil"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-violet-700 hover:text-violet-900 underline"
              >
                Gabung Program Mitra <ExternalLink size={11} />
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
