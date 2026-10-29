// src/components/career/TalentPoolExplorer.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  GraduationCap,
  Send,
  ExternalLink,
  CheckCircle2,
  MapPin,
  Sparkles,
  X,
  Briefcase,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alumni, ALUMNI_ORIGIN_LABELS, AlumniOriginSource } from '@/types/ecosystem.types';
import { useSanitizedTalentPool, usePartnerMutations } from '@/hooks/usePartners';
import { toast } from 'sonner';

interface TalentPoolExplorerProps {
  senderType: 'PARTNER' | 'TENANT';
  senderEntityId: string;
  senderCompanyName: string;
  senderPicName: string;
  senderPicContact: string;
  senderUid: string;
}

const WORK_TYPES = ['Full-time', 'Internship / Magang', 'Contract', 'Freelance / Project', 'Part-time'];

export default function TalentPoolExplorer({
  senderType,
  senderEntityId,
  senderCompanyName,
  senderPicName,
  senderPicContact,
  senderUid,
}: TalentPoolExplorerProps) {
  const { data: talents = [], isLoading } = useSanitizedTalentPool(Boolean(senderUid));
  const { sendInvitationMutation } = usePartnerMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [selectedAlumni, setSelectedAlumni] = useState<Partial<Alumni> | null>(null);
  const [roleOffered, setRoleOffered] = useState('');
  const [workType, setWorkType] = useState('Full-time');
  const [message, setMessage] = useState('');

  const filteredTalents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return talents.filter((t) => {
      if (originFilter !== 'ALL' && (t.originSource || 'STP_VOKASI') !== originFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        t.name,
        t.programTaken,
        t.district,
        t.originInstitution,
        ...(t.skills || []),
        ...(t.tools || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [talents, searchQuery, originFilter]);

  const handleOpenInvite = (alumni: Partial<Alumni>) => {
    setSelectedAlumni(alumni);
    setRoleOffered('');
    setWorkType(senderType === 'TENANT' ? 'Internship / Magang' : 'Full-time');
    setMessage(
      `Halo ${alumni.name}, kami dari ${senderCompanyName} tertarik dengan portofolio & sertifikasi Anda (${alumni.programTaken || 'Alumni Vokasi'}) dan ingin mengundang sesi diskusi / wawancara awal.`
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlumni?.id || !selectedAlumni.name) return;

    const res = await sendInvitationMutation.mutateAsync({
      alumniId: selectedAlumni.id,
      alumniName: selectedAlumni.name,
      alumniProgram: selectedAlumni.programTaken || '',
      senderType,
      senderEntityId,
      senderCompanyName,
      senderPicName,
      senderPicContact,
      senderUid,
      roleOffered: roleOffered.trim(),
      workType,
      message: message.trim(),
    });

    if (res.success) {
      toast.success(`Undangan wawancara untuk ${selectedAlumni.name} berhasil dikirim!`);
      setSelectedAlumni(null);
    } else {
      toast.error(res.error || 'Gagal mengirim undangan wawancara.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keahlian (CNC, React, QA, Welder), program diklat, atau nama talenta..."
            className="pl-10 h-10 rounded-xl border-slate-200 text-sm"
          />
        </div>
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-700"
        >
          <option value="ALL">Semua Jalur Talenta ({talents.length})</option>
          <option value="STP_VOKASI">Diklat Vokasi Solo Technopark</option>
          <option value="RSKB_SURAKARTA">RSKB Kota Surakarta</option>
          <option value="OPD_PEMKOT">Program OPD Pemkot Surakarta</option>
          <option value="CSR_INDUSTRI">Program CSR Industri</option>
          <option value="INKUBASI_WIRAUSAHA">Inkubasi Wirausaha</option>
        </select>
      </div>

      {/* Grid Talenta */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Memuat Katalog Talenta Terverifikasi...</span>
        </div>
      ) : filteredTalents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <GraduationCap className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Belum ada talenta Open-to-Work pada filter ini</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hanya alumni terverifikasi yang mengaktifkan status siap direkrut yang ditampilkan di katalog bebas-PII ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTalents.map((alumni) => {
            const originKey = (alumni.originSource || 'STP_VOKASI') as AlumniOriginSource;
            const isRskb = originKey === 'RSKB_SURAKARTA' || originKey === 'OPD_PEMKOT';
            return (
              <div
                key={alumni.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 hover:border-emerald-300 transition-all shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{alumni.name}</h4>
                        {alumni.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        {alumni.programTaken || 'Program Vokasi Terpadu'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isRskb
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isRskb ? 'RSKB Surakarta' : ALUMNI_ORIGIN_LABELS[originKey] || 'STP Vokasi'}
                    </span>
                  </div>

                  {alumni.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{alumni.bio}</p>
                  )}

                  {(alumni.forumReputationScore || 0) > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        +{alumni.forumReputationScore} Poin Kompetensi Forum
                        {(alumni.acceptedSolutionsCount || 0) > 0
                          ? ` • ${alumni.acceptedSolutionsCount} Solusi Teknis`
                          : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {(alumni.skills || []).slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                    {alumni.district && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {alumni.district}
                      </span>
                    )}
                    {alumni.workSetup && (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" /> {alumni.workSetup}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alumni.portfolioUrl && (
                      <a
                        href={alumni.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        Portofolio <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {alumni.linkedinUrl && (
                      <a
                        href={alumni.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-sky-700 hover:underline inline-flex items-center gap-1"
                      >
                        LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenInvite(alumni)}
                    className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Undang Wawancara</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Undang Wawancara */}
      {selectedAlumni && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendInvite}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Undangan Rekrutmen Resmi
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Undang {selectedAlumni.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Dikirim atas nama <strong>{senderCompanyName}</strong> melalui jembatan mediasi Karir STP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlumni(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Posisi yang Ditawarkan *</label>
                <Input
                  required
                  value={roleOffered}
                  onChange={(e) => setRoleOffered(e.target.value)}
                  placeholder="Misal: Junior Frontend / Operator CNC"
                  className="h-10 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Skema Kerja</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                >
                  {WORK_TYPES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Pesan & Jadwal Wawancara *</label>
              <Textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedAlumni(null)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={sendInvitationMutation.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{sendInvitationMutation.isPending ? 'Mengirim...' : 'Kirim Undangan Resmi'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

