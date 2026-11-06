// src/app/(admin)/manajemen-karir/components/TabSmartTalentMatchmaking.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  RotateCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { alumniService } from '@/services/alumni.service';
import { notificationService } from '@/services/notification.service';
import { Alumni } from '@/types';
import { JobListing } from '@/types/job.types';
import {
  AlumniJobMatchSummary,
  computeAlumniJobMatch,
} from '@/utils/jobSmartMatch';

interface TabSmartTalentMatchmakingProps {
  activeJobs: JobListing[];
}

interface MatchedJobItem {
  job: JobListing;
  match: AlumniJobMatchSummary;
}

interface AlumniMatchRow {
  alumni: Alumni;
  topMatches: MatchedJobItem[];
  bestScore: number;
}

function normalizePhoneForWa(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return `62${digits}`;
}

function isAlumniSeekingJob(alumni: Alumni): boolean {
  if (alumni.internalStatus === 'HIRED') return false;
  if (alumni.isLookingForJob === false) return false;
  const emp = (alumni.employmentStatus || '').toLowerCase();
  if (emp.includes('bekerja') || emp.includes('wirausaha')) return false;
  return true;
}

export default function TabSmartTalentMatchmaking({
  activeJobs,
}: TabSmartTalentMatchmakingProps) {
  const router = useRouter();
  const [alumnis, setAlumnis] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(60);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'STP' | 'RSKB'>('ALL');
  const [poolScope, setPoolScope] = useState<'SEEKING' | 'ALL'>('SEEKING');
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const loadAlumniPool = async () => {
    setLoading(true);
    try {
      const data = await alumniService.getAllAlumnis();
      setAlumnis(data);
    } catch {
      toast.error('Gagal memuat daftar Talent Pool alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumniPool();
  }, []);

  const candidateRows = useMemo<AlumniMatchRow[]>(() => {
    if (activeJobs.length === 0) return [];

    const eligibleAlumnis = alumnis.filter((a) =>
      poolScope === 'SEEKING' ? isAlumniSeekingJob(a) : true
    );

    return eligibleAlumnis
      .map((alumni) => {
        const scored: MatchedJobItem[] = activeJobs
          .map((job) => ({
            job,
            match: computeAlumniJobMatch(job, alumni),
          }))
          .sort((a, b) => b.match.score - a.match.score)
          .slice(0, 3);

        return {
          alumni,
          topMatches: scored,
          bestScore: scored[0]?.match.score || 0,
        };
      })
      .sort((a, b) => {
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        const aClaimed = a.alumni.claimedByUserId ? 1 : 0;
        const bClaimed = b.alumni.claimedByUserId ? 1 : 0;
        return bClaimed - aClaimed;
      });
  }, [alumnis, activeJobs, poolScope]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidateRows.filter(({ alumni, bestScore, topMatches }) => {
      if (bestScore < minScoreFilter) return false;

      if (sourceFilter === 'RSKB' && alumni.originSource !== 'RSKB_SURAKARTA') {
        return false;
      }
      if (sourceFilter === 'STP' && alumni.originSource === 'RSKB_SURAKARTA') {
        return false;
      }

      if (!q) return true;
      const corpus = [
        alumni.name,
        alumni.programTaken,
        ...(alumni.skills || []),
        ...(alumni.certifications || []),
        ...topMatches.map((m) => `${m.job.title} ${m.job.company}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return corpus.includes(q);
    });
  }, [candidateRows, searchQuery, minScoreFilter, sourceFilter]);

  const stats = useMemo(() => {
    const seekingCount = alumnis.filter(isAlumniSeekingJob).length;
    const highMatchCount = candidateRows.filter((r) => r.bestScore >= 75).length;
    const claimedReadyCount = candidateRows.filter(
      (r) => Boolean(r.alumni.claimedByUserId) && r.bestScore >= 70
    ).length;

    return {
      seekingCount,
      highMatchCount,
      claimedReadyCount,
      activeJobsCount: activeJobs.length,
    };
  }, [alumnis, candidateRows, activeJobs.length]);

  const handleSendJobAlert = async (alumni: Alumni, item: MatchedJobItem) => {
    if (!alumni.claimedByUserId) {
      toast.error('Alumni ini belum mengklaim akun portal. Gunakan tombol WhatsApp.');
      return;
    }

    const actionKey = `${alumni.id}::${item.job.id}`;
    setSendingKey(actionKey);
    try {
      const ok = await notificationService.createNotification({
        recipientUid: alumni.claimedByUserId,
        category: 'JOB_ALERT',
        title: `🎯 Rekomendasi Karir BKK (${item.match.score}% Match): ${item.job.title}`,
        message: `Tim BKK Solo Technopark merekomendasikan posisi ${item.job.title} di ${item.job.company} (${item.job.city || item.job.location}) karena selaras dengan profil diklat & keahlian Anda.`,
        linkUrl: `/karir/${item.job.id}`,
      });

      if (ok) {
        setSentKeys((prev) => new Set(prev).add(actionKey));
        toast.success(`Rekomendasi loker berhasil dikirim ke portal ${alumni.name}!`);
      } else {
        toast.error('Gagal mengirim notifikasi ke portal alumni.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengirim notifikasi rekomendasi.');
    } finally {
      setSendingKey(null);
    }
  };

  const handleBulkSmartBroadcast = async () => {
    const targets = filteredRows.filter(
      (row) =>
        Boolean(row.alumni.claimedByUserId) &&
        row.alumni.jobAlertEnabled !== false &&
        row.topMatches.length > 0 &&
        row.bestScore >= 70 &&
        !sentKeys.has(`${row.alumni.id}::${row.topMatches[0].job.id}`)
    );

    if (targets.length === 0) {
      toast.info('Tidak ada kandidat terklaim baru dengan skor >= 70% untuk dikirimi alert.');
      return;
    }

    setIsBroadcasting(true);
    let successCount = 0;
    const nextSent = new Set(sentKeys);

    try {
      for (const row of targets.slice(0, 25)) {
        const best = row.topMatches[0];
        if (!row.alumni.claimedByUserId || !best) continue;
        const ok = await notificationService.createNotification({
          recipientUid: row.alumni.claimedByUserId,
          category: 'JOB_ALERT',
          title: `🎯 Smart Match ${best.match.score}%: ${best.job.title}`,
          message: `Rekomendasi penyaluran BKK STP: posisi ${best.job.title} di ${best.job.company} sangat selaras dengan kompetensi Anda.`,
          linkUrl: `/karir/${best.job.id}`,
        });
        if (ok) {
          successCount++;
          nextSent.add(`${row.alumni.id}::${best.job.id}`);
        }
      }
      setSentKeys(nextSent);
      toast.success(`Berhasil mengirim Smart Job Alert ke ${successCount} alumni siap kerja!`);
    } catch {
      toast.error('Sebagian pengiriman broadcast gagal diproses.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Ringkasan KPI Matchmaking */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BKK Smart Talent Matchmaking Engine</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Meja Penyaluran Proaktif: Alumni Open-to-Work ↔ Lowongan Aktif
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mesin pencocokan otomatis berbasis keselarasan kejuruan diklat, sertifikasi, keahlian, dan target wilayah penempatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadAlumniPool}
              disabled={loading}
              className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 text-slate-700"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/pelatihan')}
              className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 text-slate-700"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Database Alumni</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleBulkSmartBroadcast}
              disabled={isBroadcasting || loading || stats.claimedReadyCount === 0}
              className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>
                {isBroadcasting
                  ? 'Mengirim Alert...'
                  : `Broadcast Smart Alert (${stats.claimedReadyCount})`}
              </span>
            </Button>
          </div>
        </div>

        {/* Kartu KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">
              Talenta Siap Salur
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {stats.seekingCount}
            </span>
            <span className="text-[11px] text-slate-500">Status Open-to-Work</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-800 block">
              Kandidat High-Match (&ge;75%)
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
              {stats.highMatchCount}
            </span>
            <span className="text-[11px] text-emerald-700/80">
              Selaras diklat & kompetensi
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[11px] font-semibold text-sky-800 block">
              Siap Push Notifikasi Portal
            </span>
            <span className="text-2xl font-extrabold text-sky-700 mt-1 block">
              {stats.claimedReadyCount}
            </span>
            <span className="text-[11px] text-sky-700/80">
              Akun terklaim & match &ge;70%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-amber-800 block">
              Bursa Lowongan Aktif
            </span>
            <span className="text-2xl font-extrabold text-amber-700 mt-1 block">
              {stats.activeJobsCount}
            </span>
            <span className="text-[11px] text-amber-700/80">
              Siap dipasangkan real-time
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama alumni, program diklat, skill, atau lowongan..."
              className="pl-9 h-10 rounded-xl border-slate-200 text-xs"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value={80}>Sangat Cocok (&ge; 80% Match)</option>
              <option value={60}>Cocok (&ge; 60% Match)</option>
              <option value={45}>Potensial (&ge; 45% Match)</option>
              <option value={0}>Tampilkan Semua Skor</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as 'ALL' | 'STP' | 'RSKB')}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="ALL">Semua Asal (STP & RSKB)</option>
              <option value="STP">Vokasi STP</option>
              <option value="RSKB">RSKB Surakarta</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={poolScope}
              onChange={(e) => setPoolScope(e.target.value as 'SEEKING' | 'ALL')}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="SEEKING">Hanya Siap Kerja</option>
              <option value="ALL">Semua Alumni</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daftar Hasil Matchmaking */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
          <RotateCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Menghitung matriks kecocokan alumni terhadap {activeJobs.length} lowongan aktif...
          </p>
        </div>
      ) : activeJobs.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-2">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Belum Ada Lowongan Aktif</p>
          <p className="text-xs text-slate-500">
            Aktifkan atau sinkronkan lowongan terlebih dahulu pada tab Daftar Lowongan atau Sinkronisasi API.
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
          <Target className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            Tidak Ada Kandidat yang Memenuhi Filter Saat Ini
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba turunkan batas minimum skor kecocokan ke &ldquo;Tampilkan Semua Skor&rdquo; atau hapus kata kunci pencarian.
          </p>
          {minScoreFilter > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMinScoreFilter(0)}
              className="rounded-xl text-xs font-bold"
            >
              Tampilkan Semua Skor Kandidat
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.slice(0, 40).map(({ alumni, topMatches, bestScore }) => {
            const waNumber = normalizePhoneForWa(alumni.phone);
            const allSkills = Array.from(
              new Set([...(alumni.skills || []), ...(alumni.certifications || [])])
            ).slice(0, 5);

            return (
              <div
                key={alumni.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:border-emerald-200 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Kolom Kiri: Profil Kandidat Alumni */}
                  <div className="lg:col-span-4 space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{alumni.name}</span>
                          {alumni.claimedByUserId && (
                            <span
                              title="Akun Portal Terklaim"
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"
                            >
                              Terklaim
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">
                            {alumni.programTaken || 'Program Vokasi STP'}
                          </span>
                        </div>
                      </div>

                      <Badge
                        className={
                          bestScore >= 80
                            ? 'bg-emerald-600 text-white text-[10px] font-bold'
                            : bestScore >= 62
                            ? 'bg-sky-600 text-white text-[10px] font-bold'
                            : 'bg-slate-200 text-slate-700 text-[10px] font-bold'
                        }
                      >
                        Top {bestScore}%
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                        {alumni.originSource === 'RSKB_SURAKARTA' ? 'RSKB Surakarta' : 'STP Vokasi'}
                      </span>
                      {alumni.batch && <span>• Batch {alumni.batch}</span>}
                      {(alumni.preferredRegion || alumni.domicile) && (
                        <span className="inline-flex items-center gap-0.5">
                          • <MapPin className="w-3 h-3" />
                          {alumni.preferredRegion || alumni.domicile}
                        </span>
                      )}
                    </div>

                    {allSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {allSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-600"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Top 3 Rekomendasi Lowongan */}
                  <div className="lg:col-span-8 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Top {topMatches.length} Rekomendasi Lowongan Aktif
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {topMatches.map((item) => {
                        const actionKey = `${alumni.id}::${item.job.id}`;
                        const alreadySent = sentKeys.has(actionKey);
                        const isSending = sendingKey === actionKey;
                        const waText = encodeURIComponent(
                          `Halo ${alumni.name}, Tim BKK Solo Technopark merekomendasikan lowongan *${item.job.title}* di *${item.job.company}* (${item.match.score}% selaras dengan kompetensi Anda). Lihat & lamar di portal karir STP: ${
                            typeof window !== 'undefined' ? window.location.origin : ''
                          }/karir/${item.job.id}`
                        );

                        return (
                          <div
                            key={item.job.id}
                            className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between gap-2.5"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    item.match.score >= 80
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.match.score >= 62
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.match.score}% {item.match.grade}
                                </span>
                                {item.job.isStpPartner && (
                                  <span title="Mitra Industri STP" className="shrink-0">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  </span>
                                )}
                              </div>

                              <Link
                                href={`/karir/${item.job.id}`}
                                target="_blank"
                                className="text-xs font-bold text-slate-900 hover:text-emerald-700 line-clamp-2 flex items-start gap-1"
                              >
                                <span>{item.job.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                              </Link>

                              <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">{item.job.company}</span>
                              </div>

                              {item.match.reasons[0] && (
                                <p className="text-[10px] text-emerald-700 font-medium line-clamp-2 bg-emerald-50/70 px-2 py-1 rounded-lg">
                                  {item.match.reasons[0]}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                              {alumni.claimedByUserId ? (
                                <button
                                  type="button"
                                  disabled={isSending || alreadySent}
                                  onClick={() => handleSendJobAlert(alumni, item)}
                                  className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                    alreadySent
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                      : 'bg-slate-900 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  {alreadySent ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Terkirim</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      <span>{isSending ? 'Mengirim...' : 'Push Portal'}</span>
                                    </>
                                  )}
                                </button>
                              ) : null}

                              {waNumber && (
                                <a
                                  href={`https://wa.me/${waNumber}?text=${waText}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Kirim rekomendasi via WhatsApp"
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WA</span>
                                </a>
                              )}

                              {!alumni.claimedByUserId && !waNumber && (
                                <span className="text-[10px] text-slate-400 italic">
                                  Kontak belum terisi
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRows.length > 40 && (
            <p className="text-center text-xs text-slate-500 py-2">
              Menampilkan 40 kandidat teratas dari {filteredRows.length} alumni yang cocok. Gunakan kolom pencarian untuk menyaring lebih spesifik.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
