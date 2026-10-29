// src/app/(admin)/manajemen-karir/components/TabForumModerationAnalytics.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Megaphone,
  Copy,
  Building2,
  MessageSquare,
  Send,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useAllPartners } from '@/hooks/usePartners';
import {
  useForumThreads,
  useAllJobApplications,
  useForumMutations,
} from '@/hooks/useAlumniForum';
import { VOCATIONAL_TRACKS, ForumThread } from '@/types/alumniForum.types';
import { toast } from 'sonner';

interface TabForumModerationAnalyticsProps {
  activeJobsCount: number;
  onRefreshJobs: () => void;
}

export default function TabForumModerationAnalytics({
  activeJobsCount,
  onRefreshJobs,
}: TabForumModerationAnalyticsProps) {
  const { role } = useAuth();
  const { data: partners = [] } = useAllPartners(true);
  const { data: allThreads = [], isLoading: loadingThreads } = useForumThreads({
    role: role || 'admin',
    includeFlagged: true,
  });
  const { data: allApplications = [] } = useAllJobApplications(true);

  const {
    moderateThreadMutation,
    promoteReferralMutation,
    broadcastNotificationMutation,
  } = useForumMutations();

  const [broadcastTitle, setBroadcastTitle] = useState(
    'Sorotan Mingguan Bursa Karir & Forum Alumni STP × RSKB'
  );
  const [targetTrack, setTargetTrack] = useState('Semua Kejuruan');
  const [digestText, setDigestText] = useState('');
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);

  // Analitik Closed-Loop Funnel
  const hiredApplications = useMemo(
    () => allApplications.filter((a) => a.status === 'HIRED'),
    [allApplications]
  );
  const hiredRskbCount = useMemo(
    () =>
      hiredApplications.filter(
        (a) => a.originSource === 'RSKB_SURAKARTA' || a.originSource === 'OPD_PEMKOT'
      ).length,
    [hiredApplications]
  );
  const hiredStpCount = hiredApplications.length - hiredRskbCount;

  // Antrean Moderasi AI & Loker Referral yang siap dipromosikan
  const flaggedThreads = useMemo(
    () =>
      allThreads.filter(
        (t) => t.moderationStatus !== 'PUBLISHED' || (t.reportedCount || 0) > 0
      ),
    [allThreads]
  );

  const promotableReferrals = useMemo(
    () =>
      allThreads.filter(
        (t) =>
          (t.channelId === 'loker-referral-alumni' || t.threadKind === 'ALUMNI_REFERRAL') &&
          !t.promotedToJobId &&
          t.moderationStatus === 'PUBLISHED'
      ),
    [allThreads]
  );

  const handleGenerateAiDigest = async () => {
    setIsGeneratingDigest(true);
    try {
      const idToken = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch('/api/forum/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          activeJobsCount,
          hiredCount: hiredApplications.length,
          threads: allThreads
            .filter((t) => t.moderationStatus === 'PUBLISHED')
            .slice(0, 6)
            .map((t) => ({
              title: t.title,
              channelId: t.channelId,
              upvoteCount: t.upvoteCount,
              replyCount: t.replyCount,
            })),
        }),
      });
      const json = await res.json();
      if (json.success && json.digestText) {
        setDigestText(json.digestText);
        toast.success('Buletin Mingguan berhasil disusun oleh Clario AI!');
      } else {
        toast.error(json.message || 'Gagal menyusun buletin AI.');
      }
    } catch {
      toast.error('Gagal menghubungi layanan Clario AI Digest.');
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!digestText.trim()) {
      toast.error('Isi pesan pengumuman terlebih dahulu atau klik Susun Buletin Clario AI.');
      return;
    }
    const ok = await broadcastNotificationMutation.mutateAsync({
      recipientUid: 'BROADCAST_ALUMNI',
      targetTrack: targetTrack === 'Semua Kejuruan' ? undefined : targetTrack,
      title: broadcastTitle.trim(),
      message: digestText.trim(),
      linkUrl: '/alumni-portal',
      category: 'BROADCAST_ALERT',
    });
    if (ok) {
      toast.success('Notifikasi Broadcast berhasil dikirim ke Portal Alumni!');
    } else {
      toast.error('Gagal mengirim notifikasi broadcast.');
    }
  };

  const handlePromoteReferral = async (thread: ForumThread) => {
    const res = await promoteReferralMutation.mutateAsync(thread);
    if (res.success) {
      toast.success('Info Loker Referral Alumni berhasil diangkat ke Bursa Karir Resmi (/karir)!');
      onRefreshJobs();
    } else {
      toast.error(res.error || 'Gagal mengangkat loker referral.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Closed-Loop Analytics Funnel */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Analitik Eksekutif Closed-Loop STP × RSKB Surakarta
            </span>
            <h3 className="text-lg font-black mt-0.5">
              Corong Konversi Kemitraan, Forum Komunitas & Serapan Kerja Nyata
            </h3>
          </div>
          <Link href="/alumni-portal" target="_blank">
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-1.5"
            >
              <span>Buka Forum Alumni 2 Zona</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <Building2 className="w-4 h-4" />
              <span>Mitra Industri Resmi</span>
            </div>
            <p className="text-2xl font-black mt-1">{partners.length}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{activeJobsCount} lowongan aktif</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
              <MessageSquare className="w-4 h-4" />
              <span>Diskusi Forum 2 Zona</span>
            </div>
            <p className="text-2xl font-black mt-1">{allThreads.length}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {flaggedThreads.length} antrean tinjauan AI
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
              <Send className="w-4 h-4" />
              <span>Lamaran 1-Klik Masuk</span>
            </div>
            <p className="text-2xl font-black mt-1">{allApplications.length}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {allApplications.filter((a) => a.status === 'INTERVIEWING').length} tahap wawancara
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>Terserap Kerja (HIRED)</span>
            </div>
            <p className="text-2xl font-black mt-1 text-emerald-300">{hiredApplications.length}</p>
            <p className="text-[11px] text-emerald-100 mt-0.5">
              STP: {hiredStpCount} • RSKB: {hiredRskbCount}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Grid 2 Kolom: Moderasi AI + Promosi Referral & Smart Broadcast Digest */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Kolom Kiri: Moderasi Anti-Pungli AI & Promosi Loker Referral */}
        <div className="space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-black text-slate-900">
                  Antrean Moderasi Keamanan Clario AI ({flaggedThreads.length})
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                Anti-Pungli & Anti-Scam
              </Badge>
            </div>

            {loadingThreads ? (
              <p className="text-xs text-slate-400 py-4">Memeriksa antrean moderasi...</p>
            ) : flaggedThreads.length === 0 ? (
              <p className="text-xs text-slate-500 bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                Seluruh percakapan forum saat ini bersih dari indikasi pungutan liar, penipuan loker, atau laporan komunitas.
              </p>
            ) : (
              <div className="space-y-3">
                {flaggedThreads.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{t.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Oleh {t.authorName} ({t.authorBadgeLabel}) • #{t.channelId}
                        </p>
                      </div>
                      <Badge className="bg-amber-500 text-white text-[10px]">
                        {t.moderationStatus}
                      </Badge>
                    </div>
                    <p className="text-slate-700 line-clamp-2">{t.content}</p>
                    {t.aiFlagReason && (
                      <p className="text-[11px] font-bold text-rose-700">
                        Alasan Deteksi AI: {t.aiFlagReason}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          t.id &&
                          moderateThreadMutation
                            .mutateAsync({ threadId: t.id, action: 'APPROVE' })
                            .then(() => toast.success('Thread disetujui tayang.'))
                        }
                        className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Tayang
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          t.id &&
                          moderateThreadMutation
                            .mutateAsync({ threadId: t.id, action: 'DELETE' })
                            .then(() => toast.success('Thread dihapus permanen.'))
                        }
                        className="h-8 px-2.5 rounded-xl border-rose-200 text-rose-700 text-xs font-bold gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kurasi 1-Klik Loker Referral Alumni -> Bursa Karir */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
            <h4 className="text-sm font-black text-slate-900">
              Promosi 1-Klik #loker-referral-alumni ke Bursa Karir ({promotableReferrals.length})
            </h4>
            {promotableReferrals.length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada kiriman loker orang-dalam baru dari alumni senior yang menunggu diangkat ke halaman /karir.
              </p>
            ) : (
              <div className="space-y-2.5">
                {promotableReferrals.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Info dari {t.authorName} • {t.vocationalTrack}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={promoteReferralMutation.isPending}
                      onClick={() => handlePromoteReferral(t)}
                      className="h-8 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0"
                    >
                      Angkat ke /karir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Clario AI Weekly Digest & Smart Targeted Broadcast */}
        <form
          onSubmit={handleSendBroadcast}
          className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Clario AI Community Digest & Broadcast
              </span>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">
                Buletin Mingguan & Pengumuman Terarah Alumni
              </h4>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isGeneratingDigest}
              onClick={handleGenerateAiDigest}
              className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold gap-1.5 shrink-0"
            >
              {isGeneratingDigest ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Susun Otomatis AI</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Judul Notifikasi</label>
              <Input
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Segmen Kejuruan Target</label>
              <select
                value={targetTrack}
                onChange={(e) => setTargetTrack(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                {VOCATIONAL_TRACKS.map((tr) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Isi Buletin / Pesan Siaran (Siap In-App & Grup WhatsApp)
            </label>
            <Textarea
              rows={7}
              value={digestText}
              onChange={(e) => setDigestText(e.target.value)}
              placeholder="Klik 'Susun Otomatis AI' untuk merangkum lowongan aktif, topik terhangat forum, dan capaian serapan kerja minggu ini..."
              className="rounded-2xl text-xs leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!digestText.trim()) return;
                navigator.clipboard?.writeText(digestText);
                toast.success('Teks buletin disalin untuk Grup WhatsApp Alumni!');
              }}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Format WhatsApp</span>
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={broadcastNotificationMutation.isPending}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Siarkan ke Portal Alumni</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

