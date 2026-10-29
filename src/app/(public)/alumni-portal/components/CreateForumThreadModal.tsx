// src/app/(public)/alumni-portal/components/CreateForumThreadModal.tsx
'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ForumChannelDefinition,
  ForumActorType,
  ForumThreadKind,
  ForumPortfolioEmbed,
  VOCATIONAL_TRACKS,
} from '@/types/alumniForum.types';
import { JobListing } from '@/types/job.types';
import { useForumMutations } from '@/hooks/useAlumniForum';
import { toast } from 'sonner';

interface CreateForumThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: ForumChannelDefinition[];
  defaultChannelId?: string;
  currentUid: string;
  currentName: string;
  actorType: ForumActorType;
  actorBadgeLabel: string;
  alumniId?: string;
  entityId?: string;
  myPortfolioEmbed?: ForumPortfolioEmbed;
  availableJobs?: JobListing[];
}

export default function CreateForumThreadModal({
  isOpen,
  onClose,
  channels,
  defaultChannelId,
  currentUid,
  currentName,
  actorType,
  actorBadgeLabel,
  alumniId,
  entityId,
  myPortfolioEmbed,
  availableJobs = [],
}: CreateForumThreadModalProps) {
  const { createThreadMutation } = useForumMutations();

  const initialChannel =
    channels.find((c) => c.id === defaultChannelId) || channels[0];

  const [channelId, setChannelId] = useState(initialChannel?.id || 'sapa-industri-dan-rekrutmen');
  const [vocationalTrack, setVocationalTrack] = useState('Semua Kejuruan');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Optional Rich Embeds
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [includeProjectBrief, setIncludeProjectBrief] = useState(false);
  const [budgetRange, setBudgetRange] = useState('Rp 2.500.000 - Rp 5.000.000');
  const [deadline, setDeadline] = useState('14 Hari Kerja');
  const [teamQuota, setTeamQuota] = useState(2);

  const [includeAmaCard, setIncludeAmaCard] = useState(false);
  const [amaDate, setAmaDate] = useState('');
  const [amaTime, setAmaTime] = useState('13:30 - 15:00 WIB');
  const [amaLocation, setAmaLocation] = useState('Gedung Sembrani Solo Technopark / Zoom');

  if (!isOpen) return null;

  const selectedChannel = channels.find((c) => c.id === channelId) || channels[0];
  const linkedJob = availableJobs.find((j) => j.id === selectedJobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel) return;

    const kind: ForumThreadKind = includeProjectBrief
      ? 'MICRO_PROJECT'
      : includeAmaCard
      ? 'EVENT_AMA'
      : linkedJob
      ? 'JOB_SPOTLIGHT'
      : selectedChannel.defaultThreadKind;

    const res = await createThreadMutation.mutateAsync({
      channelId: selectedChannel.id,
      zone: selectedChannel.zone,
      threadKind: kind,
      vocationalTrack,
      title: title.trim(),
      content: content.trim(),
      authorUid: currentUid,
      authorName: currentName,
      authorActorType: actorType,
      authorBadgeLabel: actorBadgeLabel,
      authorAlumniId: alumniId,
      authorEntityId: entityId,
      linkedJobId: linkedJob?.id,
      jobEmbed: linkedJob
        ? {
            jobId: linkedJob.id,
            title: linkedJob.title,
            company: linkedJob.company,
            location: linkedJob.location,
            workType: linkedJob.workType,
          }
        : undefined,
      portfolioEmbed: attachPortfolio ? myPortfolioEmbed : undefined,
      microProjectBrief: includeProjectBrief
        ? {
            budgetRange,
            deadline,
            requiredSkills: [vocationalTrack],
            teamQuota: Number(teamQuota) || 1,
            projectStatus: 'OPEN',
            applicantUids: [],
          }
        : undefined,
      eventAmaEmbed:
        includeAmaCard && amaDate
          ? {
              eventDate: amaDate,
              eventTime: amaTime,
              locationOrLink: amaLocation,
              quota: 50,
              rsvpUids: [],
            }
          : undefined,
      isPinned: false,
    });

    if (res.success) {
      if (res.flagged) {
        toast.warning(
          `Topik ditahan sementara oleh Clario AI Safety Filter: ${res.reason || 'Menunggu verifikasi Moderator STP.'}`
        );
      } else {
        toast.success(`Topik berhasil diterbitkan di ${selectedChannel.name}!`);
      }
      setTitle('');
      setContent('');
      onClose();
    } else {
      toast.error(res.error || 'Gagal menerbitkan topik forum.');
    }
  };

  return (
    <div className="workspace-page-container py-2 sm:py-4">
      <div className="workspace-header mb-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors"
        >
          ← Kembali ke Forum Alumni
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="workspace-card w-full p-5 sm:p-8 space-y-5"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Mulai Diskusi / Kolaborasi Baru
            </span>
            <h3 className="text-lg font-black text-slate-900">
              Posting sebagai {currentName} ({actorBadgeLabel})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Pilih Kanal Forum *</label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold"
            >
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.zone === 'ZONE_A_ALUMNI_ONLY' ? '🔒 ' : '🤝 '}
                  {ch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Rumpun Kejuruan</label>
            <select
              value={vocationalTrack}
              onChange={(e) => setVocationalTrack(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold"
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
          <label className="text-xs font-bold text-slate-700">Judul Topik / Proyek / Loker Referral *</label>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: [Loker Referral] Dicari 2 Operator CNC di Cikarang / Butuh Tim Pembuatan Web UMKM"
            className="rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Isi Diskusi Lengkap *</label>
          <Textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tuliskan konteks lengkap, kualifikasi, atau permasalahan teknis..."
            className="rounded-xl text-xs"
          />
        </div>

        {/* Opsi Rich Actionable Cards */}
        <div className="p-3.5 rounded-2xl bg-slate-50 space-y-3 text-xs">
          <p className="font-extrabold text-slate-800">Sematan Kartu Interaktif (Opsional):</p>

          <div className="flex flex-wrap gap-4">
            {myPortfolioEmbed && (
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachPortfolio}
                  onChange={(e) => setAttachPortfolio(e.target.checked)}
                />
                <span>Sematkan Kartu Portofolio Saya</span>
              </label>
            )}

            <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeProjectBrief}
                onChange={(e) => setIncludeProjectBrief(e.target.checked)}
              />
              <span>Kartu Order Proyek Mikro</span>
            </label>

            <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAmaCard}
                onChange={(e) => setIncludeAmaCard(e.target.checked)}
              />
              <span>Kartu Jadwal AMA / Walk-In RSVP</span>
            </label>
          </div>

          {availableJobs.length > 0 && (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs"
            >
              <option value="">-- Tautkan ke Lowongan Bursa Karir (Opsional) --</option>
              {availableJobs.slice(0, 25).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company}
                </option>
              ))}
            </select>
          )}

          {includeProjectBrief && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <Input
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                placeholder="Fee / Anggaran"
                className="h-9 text-xs bg-white"
              />
              <Input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Estimasi Durasi"
                className="h-9 text-xs bg-white"
              />
              <Input
                type="number"
                min={1}
                value={teamQuota}
                onChange={(e) => setTeamQuota(Number(e.target.value))}
                placeholder="Kuota Alumni"
                className="h-9 text-xs bg-white"
              />
            </div>
          )}

          {includeAmaCard && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <Input
                type="date"
                value={amaDate}
                onChange={(e) => setAmaDate(e.target.value)}
                className="h-9 text-xs bg-white"
              />
              <Input
                value={amaTime}
                onChange={(e) => setAmaTime(e.target.value)}
                placeholder="Jam Pelaksanaan"
                className="h-9 text-xs bg-white"
              />
              <Input
                value={amaLocation}
                onChange={(e) => setAmaLocation(e.target.value)}
                placeholder="Lokasi / Tautan Zoom"
                className="h-9 text-xs bg-white"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Dilindungi Filter Anti-Pungli Clario AI
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createThreadMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
            >
              {createThreadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Terbitkan Topik</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

