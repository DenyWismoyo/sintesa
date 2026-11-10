'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShieldCheck, ThumbsUp, GraduationCap, Building2 } from 'lucide-react';

export interface PublicReviewCardProps {
  id?: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  verifiedBadge?: string;
  rating: number; // Skala 1 s/d 5
  title?: string;
  content: string;
  programTitle?: string;
  batchInfo?: string;
  date?: string;
  helpfulCount?: number;
  isLiked?: boolean;
  onLike?: (id?: string) => void;
  className?: string;
}

export function PublicReviewCard({
  id,
  authorName,
  authorRole,
  authorAvatar,
  verifiedBadge,
  rating,
  title,
  content,
  programTitle,
  batchInfo,
  date,
  helpfulCount = 0,
  isLiked: initialIsLiked = false,
  onLike,
  className = '',
}: PublicReviewCardProps) {
  const [liked, setLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(helpfulCount);

  const handleToggleLike = () => {
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    if (onLike) onLike(id);
  };

  // Render 5 bintang rating
  const renderStars = () => {
    return (
      <div className="flex items-center gap-1" aria-label={`Rating ${rating} dari 5 bintang`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-200'
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`public-card p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all hover:shadow-md ${className}`}
    >
      <div className="space-y-3">
        {/* Header: Profil Pemberi Ulasan & Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar / Inisial */}
            <div className="relative w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm overflow-hidden shrink-0">
              {authorAvatar ? (
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <span>{authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
                {authorName}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {authorRole && (
                  <span className="text-[11px] font-medium text-slate-500">
                    {authorRole}
                  </span>
                )}
                {authorRole && date && <span className="text-slate-300">•</span>}
                {date && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    {date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating Bintang */}
          <div className="flex flex-col items-end shrink-0">
            {renderStars()}
            <span className="text-[10px] font-black text-slate-500 mt-1">
              {rating.toFixed(1)} / 5.0
            </span>
          </div>
        </div>

        {/* Lencana Terverifikasi (Opsional) */}
        {verifiedBadge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
            <span>{verifiedBadge}</span>
          </div>
        )}

        {/* Program / Konteks Terkait */}
        {programTitle && (
          <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-lg">
            <span>{programTitle}</span>
            {batchInfo && <span className="text-indigo-400 font-normal"> ({batchInfo})</span>}
          </div>
        )}

        {/* Judul & Isi Ulasan */}
        <div className="space-y-1 pt-1">
          {title && (
            <h5 className="font-bold text-sm text-slate-900 leading-snug">
              {title}
            </h5>
          )}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
            "{content}"
          </p>
        </div>
      </div>

      {/* Footer Kartu: Reaksi Bermanfaat (Helpful Upvote) */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span className="text-[11px]">Apakah ulasan ini bermanfaat?</span>

        <button
          type="button"
          onClick={handleToggleLike}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            liked
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
          }`}
          aria-label="Tandai ulasan bermanfaat"
        >
          <ThumbsUp size={12} className={liked ? 'fill-emerald-600 text-emerald-600' : ''} />
          <span>Bermanfaat</span>
          {likesCount > 0 && <span className="font-black text-[11px]">({likesCount})</span>}
        </button>
      </div>
    </div>
  );
}

export default PublicReviewCard;

