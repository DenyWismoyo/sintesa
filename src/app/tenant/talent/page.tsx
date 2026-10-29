// src/app/tenant/talent/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Briefcase,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import { useEntityJobs, useSentTalentInvitations } from '@/hooks/usePartners';
import TalentPoolExplorer from '@/components/career/TalentPoolExplorer';
import PartnerJobDraftModal from '@/components/career/PartnerJobDraftModal';
import EntityApplicantsPanel from '@/components/career/EntityApplicantsPanel';
import { useEntityJobApplications } from '@/hooks/useAlumniForum';

export default function TenantTalentBridgePage() {
  const { user, tenantId } = useAuth();
  const { useTenantProfile } = useTenants();
  const { data: tenantProfile } = useTenantProfile(user?.uid);
  const effectiveTenantId = tenantProfile?.id || tenantId || '';

  const { data: tenantJobs = [] } = useEntityJobs({ tenantId: effectiveTenantId });
  const { data: sentInvitations = [] } = useSentTalentInvitations(user?.uid);
  const { data: incomingApplicants = [] } = useEntityJobApplications({ tenantId: effectiveTenantId || null });

  const [activeTab, setActiveTab] = useState<'TALENTS' | 'JOBS' | 'APPLICANTS' | 'INVITATIONS'>('TALENTS');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Jembatan Startup Tenant x Alumni */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-emerald-950 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[11px] font-bold">
            Sinergi Inkubasi Startup × Talenta Vokasi & RSKB
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Rekrut Talenta & Magang Alumni — {tenantProfile?.name || 'Startup Tenant STP'}
          </h1>
          <p className="text-xs text-slate-200/90 max-w-2xl leading-relaxed">
            Perkuat tim teknis dan bisnis startup Anda dengan lulusan terverifikasi Diklat Solo Technopark dan program Rumah Siap Kerja Bersama (RSKB) Kota Surakarta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/alumni-portal?channel=bursa-proyek-dan-wirausaha">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold text-xs gap-2"
            >
              <MessageSquare className="w-4 h-4 text-sky-300" />
              <span>Forum Zona Industri</span>
            </Button>
          </Link>
          <Button
            type="button"
            onClick={() => setIsDraftModalOpen(true)}
            disabled={!effectiveTenantId}
            className="h-11 px-5 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Lowongan / Magang Startup</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto gap-1 w-full sm:w-fit">
        {[
          { id: 'TALENTS', label: 'Katalog Talenta Siap Kerja', icon: GraduationCap },
          { id: 'APPLICANTS', label: `Pelamar Masuk (${incomingApplicants.length})`, icon: Users },
          { id: 'JOBS', label: `Lowongan Startup Saya (${tenantJobs.length})`, icon: Briefcase },
          { id: 'INVITATIONS', label: `Undangan Terkirim (${sentInvitations.length})`, icon: Send },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'TALENTS' && user && (
        <TalentPoolExplorer
          senderType="TENANT"
          senderEntityId={effectiveTenantId || user.uid}
          senderCompanyName={tenantProfile?.name || user.displayName || 'Startup Tenant STP'}
          senderPicName={tenantProfile?.ownerName || user.displayName || 'Founder Startup'}
          senderPicContact={tenantProfile?.email || user.email || ''}
          senderUid={user.uid}
        />
      )}

      {activeTab === 'APPLICANTS' && (
        <EntityApplicantsPanel tenantId={effectiveTenantId} accentColor="sky" />
      )}

      {activeTab === 'JOBS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Kebutuhan Talenta & Magang Startup</h3>
          {tenantJobs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Belum ada pengajuan lowongan atau posisi magang dari startup Anda.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tenantJobs.map((job) => (
                <div key={job.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{job.title}</h4>
                    <p className="text-xs text-slate-500">
                      {job.workType} • {job.workSetup}
                    </p>
                  </div>
                  {job.approvalStatus === 'PENDING_APPROVAL' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                      <Clock className="w-3 h-3" /> Menunggu Kurasi STP
                    </span>
                  ) : job.approvalStatus === 'REJECTED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                      <XCircle className="w-3 h-3" /> Ditolak
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Tayang di Bursa Karir
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'INVITATIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-slate-900">Undangan Wawancara yang Dikirim</h3>
          {sentInvitations.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Belum ada undangan wawancara ke alumni.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {sentInvitations.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {inv.alumniName} — <span className="text-sky-700">{inv.roleOffered}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5 line-clamp-1">{inv.message}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PartnerJobDraftModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        senderType="TENANT"
        entityId={effectiveTenantId || user?.uid || ''}
        companyName={tenantProfile?.name || 'Startup Tenant STP'}
        companyLogo={tenantProfile?.logoUrl}
        defaultLocation="On-site (Solo Technopark)"
        defaultEmail={tenantProfile?.email || user?.email || ''}
      />
    </div>
  );
}
