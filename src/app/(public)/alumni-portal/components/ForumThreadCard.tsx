// src/app/(public)/alumni-portal/components/ForumThreadCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Pin,
  Briefcase,
  Users,
  Calendar,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';
import { ForumThread, DEFAULT_FORUM_CHANNELS } from '@/types/alumniForum.types';

interface ForumThreadCardProps {
  thread: ForumThread;
  currentUid?: string;
  onOpenDetail: (thread: ForumThread) => void;
  onUpvote: (thread: ForumThread) => void;
  onApplyProject: (thread: ForumThread) => void;
  onToggleRsvp: (thread: ForumThread) => void;
}

const ACTOR_BADGE_STYLES: Record<string, string> = {
  ALUMNI_STP: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ALUMNI_RSKB: 'bg-sky-50 text-sky-800 border-sky-200',
  PARTNER_INDUSTRI: 'bg-amber-50 text-amber-900 border-amber-300',
  TENANT_STP: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  ADMIN_MENTOR: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function ForumThreadCard({
  thread,
  currentUid,
  onOpenDetail,
  onUpvote,
  onApplyProject,
  onToggleRsvp,
}: ForumThreadCardProps) {
  const channel = DEFAULT_FORUM_CHANNELS.find((c) => c.id === thread.channelId);
  const hasUpvoted = currentUid ? (thread.upvotedByUids || []).includes(currentUid) : false;
  const hasJoinedProject =
    currentUid && thread.microProjectBrief
      ? (thread.microProjectBrief.applicantUids || []).includes(currentUid)
      : false;
  const hasRsvped =
    currentUid && thread.eventAmaEmbed
      ? (thread.eventAmaEmbed.rsvpUids || []).includes(currentUid)
      : false;

  return (
    <div className="public-card p-5 sm:p-6 space-y-4 transition-all hover:shadow-md">
      {/* Header Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
              <Pin className="w-3 h-3" /> Disematkan
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            {channel?.name || `#${thread.channelId}`}
          </span>
          {thread.vocationalTrack && thread.vocationalTrack !== 'Semua Kejuruan' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50/70 text-emerald-800 text-[10px] font-bold">
              {thread.vocationalTrack}
            </span>
          )}
          {thread.acceptedReplyId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> Terjawab Solusi Terbaik
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {new Date(thread.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Author & Content */}
      <div className="space-y-2 cursor-pointer" onClick={() => onOpenDetail(thread)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-extrabold text-slate-900">{thread.authorName}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              ACTOR_BADGE_STYLES[thread.authorActorType] || 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {thread.authorBadgeLabel}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-900 hover:text-emerald-700 transition-colors">
          {thread.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line">
          {thread.content}
        </p>
      </div>

      {/* EMBED 1: KARTU SEMATAN LOWONGAN (JOB EMBED CARD) */}
      {thread.jobEmbed && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-emerald-700 inline-flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Lowongan Terhubung Bursa Karir
            </span>
            <p className="text-xs font-extrabold text-slate-900">
              {thread.jobEmbed.title} — {thread.jobEmbed.company}
            </p>
            <p className="text-[11px] text-slate-600">
              {thread.jobEmbed.location} • {thread.jobEmbed.workType}
              {thread.jobEmbed.salaryText ? ` • ${thread.jobEmbed.salaryText}` : ''}
            </p>
          </div>
          <Link
            href={`/karir/${thread.jobEmbed.jobId}`}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Lihat & Lamar</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* EMBED 2: ORDER PROYEK MIKRO / SUB-KONTRAK (MICRO-PROJECT BRIEF) */}
      {thread.microProjectBrief && (
        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-sky-800 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Order Proyek Mikro / Kolaborasi
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white text-sky-800 text-[10px] font-bold">
              Fee / Anggaran: {thread.microProjectBrief.budgetRange}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
            <span>
              Tenggat: <strong>{thread.microProjectBrief.deadline}</strong> • Kuota Tim:{' '}
              <strong>
                {(thread.microProjectBrief.applicantUids || []).length}/
                {thread.microProjectBrief.teamQuota} Alumni
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onApplyProject(thread)}
              disabled={Boolean(hasJoinedProject)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                hasJoinedProject
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {hasJoinedProject ? 'Sudah Tergabung Minat Proyek' : 'Ajukan Diri / Gabung Proyek'}
            </button>
          </div>
        </div>
      )}

      {/* EMBED 3: SESI AMA HRD / WALK-IN INTERVIEW (RSVP CARD) */}
      {thread.eventAmaEmbed && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <span className="text-[10px] font-black uppercase text-amber-800 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Jadwal Sesi AMA HRD / Walk-In Rekrutmen
            </span>
            <p className="font-bold text-slate-900">
              {thread.eventAmaEmbed.eventDate} • {thread.eventAmaEmbed.eventTime}
            </p>
            <p className="text-[11px] text-slate-600">
              Lokasi/Link: {thread.eventAmaEmbed.locationOrLink} • Hadir:{' '}
              {(thread.eventAmaEmbed.rsvpUids || []).length}/{thread.eventAmaEmbed.quota} kursi
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleRsvp(thread)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 ${
              hasRsvped
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {hasRsvped ? 'Terdaftar Hadir ✓' : 'Daftar Hadir 1-Klik'}
          </button>
        </div>
      )}

      {/* EMBED 4: KARTU PORTOFOLIO ALUMNI (TALENT PITCH CARD) */}
      {thread.portfolioEmbed && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Kartu Portofolio: {thread.portfolioEmbed.name}
            </span>
            <p className="text-[11px] text-slate-500">
              {thread.portfolioEmbed.programTaken || 'Alumni Vokasi'} •{' '}
              {(thread.portfolioEmbed.skills || []).slice(0, 4).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {thread.portfolioEmbed.portfolioUrl && (
              <a
                href={thread.portfolioEmbed.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
              >
                Portofolio <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {thread.portfolioEmbed.resumeUrl && (
              <a
                href={thread.portfolioEmbed.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
              >
                CV <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpvote(thread)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              hasUpvoted
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{thread.upvoteCount || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDetail(thread)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{thread.replyCount || 0} Diskusi</span>
          </button>
        </div>

        {thread.promotedToJobId && (
          <Link
            href={`/karir/${thread.promotedToJobId}`}
            className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5" /> Resmi Diangkat ke Bursa Karir
          </Link>
        )}
      </div>
    </div>
  );
}

