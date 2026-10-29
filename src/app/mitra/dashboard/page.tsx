// src/app/mitra/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  GraduationCap,
  Send,
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  Users,
  MessageSquare,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import {
  useMyPartnerProfile,
  useEntityJobs,
  useSentTalentInvitations,
  usePartnerMutations,
} from '@/hooks/usePartners';
import { PARTNER_TIER_LABELS } from '@/types/partnership.types';
import TalentPoolExplorer from '@/components/career/TalentPoolExplorer';
import PartnerJobDraftModal from '@/components/career/PartnerJobDraftModal';
import EntityApplicantsPanel from '@/components/career/EntityApplicantsPanel';
import ChangePasswordCard from '@/components/auth/ChangePasswordCard';
import { useEntityJobApplications } from '@/hooks/useAlumniForum';
import { toast } from 'sonner';

export default function MitraDashboardPage() {
  const { user, partnerId } = useAuth();
  const { data: partnerProfile } = useMyPartnerProfile(user?.uid, partnerId);
  const effectivePartnerId = partnerProfile?.id || partnerId || '';

  const { data: myJobs = [] } = useEntityJobs({ partnerId: effectivePartnerId });
  const { data: myInvitations = [] } = useSentTalentInvitations(user?.uid);
  const { data: incomingApplicants = [] } = useEntityJobApplications({ partnerId: effectivePartnerId || null });
  const { updateProfileMutation } = usePartnerMutations();

  const [activeTab, setActiveTab] = useState<'JOBS' | 'APPLICANTS' | 'TALENTS' | 'INVITATIONS' | 'PROFILE' | 'SECURITY'>('JOBS');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [industrySector, setIndustrySector] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (partnerProfile) {
      setCompanyName(partnerProfile.companyName || '');
      setIndustrySector(partnerProfile.industrySector || '');
      setLocation(partnerProfile.location || '');
      setWebsiteUrl(partnerProfile.websiteUrl || '');
      setDescription(partnerProfile.description || '');
    }
  }, [partnerProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectivePartnerId) return;
    const ok = await updateProfileMutation.mutateAsync({
      partnerId: effectivePartnerId,
      data: { companyName, industrySector, location, websiteUrl, description },
    });
    if (ok) toast.success('Profil perusahaan mitra berhasil diperbarui!');
    else toast.error('Gagal menyimpan profil perusahaan.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-bold">
            {partnerProfile?.tier ? PARTNER_TIER_LABELS[partnerProfile.tier] : 'Mitra Penyaluran Kerja'}
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            {partnerProfile?.companyName || 'Workspace Mitra Industri Solo Technopark'}
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
            Kelola lowongan pekerjaan eksklusif perusahaan Anda dan jangkau talenta lulusan tersertifikasi Vokasi Solo Technopark serta program Rumah Siap Kerja Bersama (RSKB) Kota Surakarta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/alumni-portal?channel=bursa-proyek-dan-wirausaha">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>Forum Zona Industri</span>
            </Button>
          </Link>
          <Button
            type="button"
            onClick={() => setIsDraftModalOpen(true)}
            disabled={!effectivePartnerId}
            className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Lowongan Baru</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto gap-1 w-full sm:w-fit">
        {[
          { id: 'JOBS', label: `Lowongan Saya (${myJobs.length})`, icon: Briefcase },
          { id: 'APPLICANTS', label: `Pelamar Masuk (${incomingApplicants.length})`, icon: Users },
          { id: 'TALENTS', label: 'Katalog Talenta STP × RSKB', icon: GraduationCap },
          { id: 'INVITATIONS', label: `Undangan Wawancara (${myInvitations.length})`, icon: Send },
          { id: 'PROFILE', label: 'Profil Perusahaan', icon: Building2 },
          { id: 'SECURITY', label: 'Keamanan & Sandi', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOWONGAN SAYA */}
      {activeTab === 'JOBS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Daftar Lowongan & Magang Perusahaan</h3>
          {myJobs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                Belum ada lowongan yang diajukan. Klik tombol <strong>Ajukan Lowongan Baru</strong> untuk mulai merekrut alumni.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myJobs.map((job) => (
                <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{job.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.category} • {job.workType} ({job.workSetup}) • {job.location}
                    </p>
                    {job.rejectionReason && job.approvalStatus === 'REJECTED' && (
                      <p className="text-[11px] text-rose-600 mt-1">Catatan Kurator: {job.rejectionReason}</p>
                    )}
                  </div>
                  <div>
                    {job.approvalStatus === 'PENDING_APPROVAL' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        <Clock className="w-3 h-3" /> Menunggu Verifikasi STP
                      </span>
                    ) : job.approvalStatus === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                        <XCircle className="w-3 h-3" /> Perlu Revisi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Tayang di Bursa Alumni
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB PELAMAR MASUK */}
      {activeTab === 'APPLICANTS' && (
        <EntityApplicantsPanel partnerId={effectivePartnerId} accentColor="emerald" />
      )}

      {/* TAB 2: KATALOG TALENTA */}
      {activeTab === 'TALENTS' && user && (
        <TalentPoolExplorer
          senderType="PARTNER"
          senderEntityId={effectivePartnerId || user.uid}
          senderCompanyName={partnerProfile?.companyName || user.displayName || 'Mitra Industri STP'}
          senderPicName={partnerProfile?.picName || user.displayName || 'HRD Mitra'}
          senderPicContact={partnerProfile?.picEmail || user.email || ''}
          senderUid={user.uid}
        />
      )}

      {/* TAB 3: UNDANGAN WAWANCARA */}
      {activeTab === 'INVITATIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Riwayat Undangan Wawancara ke Alumni</h3>
          {myInvitations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Belum ada undangan wawancara yang dikirim dari Katalog Talenta.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {myInvitations.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {inv.alumniName} — <span className="text-emerald-700">{inv.roleOffered}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5 line-clamp-1">{inv.message}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFIL PERUSAHAAN */}
      {activeTab === 'PROFILE' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs max-w-2xl"
        >
          <h3 className="text-base font-bold text-slate-900">Profil Resmi Perusahaan Mitra</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Perusahaan / Instansi</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Sektor Industri</label>
              <Input value={industrySector} onChange={(e) => setIndustrySector(e.target.value)} className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Lokasi Utama</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Website Resmi</label>
              <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="rounded-xl text-sm" />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Deskripsi Singkat Perusahaan</label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl text-xs" />
            </div>
          </div>
          <Button type="submit" disabled={updateProfileMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan Profil</span>
          </Button>
        </form>
      )}

      {/* TAB 5: KEAMANAN & KATA SANDI */}
      {activeTab === 'SECURITY' && (
        <div className="max-w-2xl">
          <ChangePasswordCard />
        </div>
      )}

      <PartnerJobDraftModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        senderType="PARTNER"
        entityId={effectivePartnerId || user?.uid || ''}
        companyName={partnerProfile?.companyName || user?.displayName || 'Mitra Industri STP'}
        companyLogo={partnerProfile?.companyLogo}
        defaultLocation={partnerProfile?.location || 'Surakarta, Jawa Tengah'}
        defaultEmail={partnerProfile?.picEmail || user?.email || ''}
      />
    </div>
  );
}
