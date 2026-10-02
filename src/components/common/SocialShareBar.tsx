// Lokasi: src/components/common/SocialShareBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareBarProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
  compact?: boolean;
}

export function SocialShareBar({
  title,
  description = '',
  url,
  className = '',
  compact = false
}: SocialShareBarProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
    } else if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Tautan berhasil disalin ke clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(`${title} — Solo Technopark\n\n${description ? description.slice(0, 120) + '...\n\n' : ''}${currentUrl}`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && (
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Share2 size={13} /> Bagikan:
        </span>
      )}

      {/* WhatsApp */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/60 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
        title="Bagikan ke WhatsApp"
        aria-label="Bagikan ke WhatsApp"
      >
        <MessageCircle size={15} />
      </a>

      {/* LinkedIn */}
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white border border-sky-200/60 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
        title="Bagikan ke LinkedIn"
        aria-label="Bagikan ke LinkedIn"
      >
        <Linkedin size={15} />
      </a>

      {/* Twitter / X */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white border border-slate-200 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
        title="Bagikan ke X (Twitter)"
        aria-label="Bagikan ke X"
      >
        <Twitter size={14} />
      </a>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`h-9 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border ${
          copied
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
        }`}
        title="Salin Tautan"
      >
        {copied ? (
          <>
            <Check size={14} />
            <span>Tersalin</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>Salin</span>
          </>
        )}
      </button>
    </div>
  );
}
