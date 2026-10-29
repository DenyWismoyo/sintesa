// src/app/(public)/alumni-portal/ClientPage.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Lock, KeyRound, Briefcase, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { canAccessAlumniForum, isInternalStaff, APP_ROLES } from '@/config/roles';
import { alumniForumService } from '@/services/alumniForum.service';
import { alumniService } from '@/services/alumni.service';
import { useForumThreads, useForumMutations } from '@/hooks/useAlumniForum';
import { useMyPartnerProfile } from '@/hooks/usePartners';
import { useTenants } from '@/hooks/useTenants';
import { useJobs } from '@/hooks/useJobs';
import {
  ForumActorType,
  ForumPortfolioEmbed,
  ForumThread,
  VOCATIONAL_TRACKS,
} from '@/types/alumniForum.types';
import { Alumni } from '@/types/ecosystem.types';
import ForumZoneSidebar from './components/ForumZoneSidebar';
import ForumThreadCard from './components/ForumThreadCard';
import ForumThreadDetailModal from './components/ForumThreadDetailModal';
import CreateForumThreadModal from './components/CreateForumThreadModal';
import { toast } from 'sonner';

export default function AlumniPortalClientPage() {
  const searchParams = useSearchParams();
  const initialChannelParam = searchParams.get('channel') || 'ALL';

  const { user, role, partnerId, tenantId, loading: authLoading } = useAuth();
  const canEnterForum = canAccessAlumniForum(role);

  const [activeChannel, setActiveChannel] = useState<string>(initialChannelParam);
  const [vocationalTrack, setVocationalTrack] = useState<string>('Semua Kejuruan');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [myAlumni, setMyAlumni] = useState<Alumni | null>(null);

  useEffect(() => {
    let active = true;
    if (user?.uid && role === APP_ROLES.ALUMNI) {
      alumniService
        .getAlumniByUserId(user.uid)
        .then((res) => {
          if (active && res) setMyAlumni(res);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [user?.uid, role]);

  const { data: partnerProfile } = useMyPartnerProfile(
    role === APP_ROLES.INDUSTRI ? user?.uid : null,
    partnerId
  );
  const { useTenantProfile } = useTenants();
  const { data: tenantProfile } = useTenantProfile(
    role === APP_ROLES.TENANT ? user?.uid : null
  );
  const { data: jobsRes } = useJobs({}, { enabled: canEnterForum });

  const visibleChannels = useMemo(
    () => alumniForumService.getVisibleChannels(role),
    [role]
  );

  const { data: threads = [], isLoading } = useForumThreads({
    role,
    channelId: activeChannel,
    vocationalTrack,
    enabled: canEnterForum,
  });

  const { toggleUpvoteMutation, applyMicroProjectMutation, toggleRsvpMutation } =
    useForumMutations();

  const filteredThreads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q)
    );
  }, [threads, searchTerm]);

  // Identitas & Lencana Terverifikasi Otomatis
  const actorIdentity = useMemo((): {
    actorType: ForumActorType;
    badgeLabel: string;
    displayName: string;
    entityId?: string;
    portfolioEmbed?: ForumPortfolioEmbed;
  } => {
    if (isInternalStaff(role)) {
      return {
        actorType: 'ADMIN_MENTOR',
        badgeLabel: 'Moderator / Mentor Resmi STP',
        displayName: user?.displayName || 'Tim Karir STP',
      };
    }
    if (role === APP_ROLES.INDUSTRI) {
      return {
        actorType: 'PARTNER_INDUSTRI',
        badgeLabel: `Mitra Industri • ${partnerProfile?.companyName || 'Terverifikasi'}`,
        displayName: partnerProfile?.picName || user?.displayName || 'HRD Mitra',
        entityId: partnerProfile?.id || partnerId || undefined,
      };
    }
    if (role === APP_ROLES.TENANT) {
      return {
        actorType: 'TENANT_STP',
        badgeLabel: `Startup Tenant STP • ${tenantProfile?.name || 'Inkubasi'}`,
        displayName: tenantProfile?.ownerName || user?.displayName || 'Founder Tenant',
        entityId: tenantProfile?.id || tenantId || undefined,
      };
    }
    const isRskb =
      myAlumni?.originSource === 'RSKB_SURAKARTA' || myAlumni?.originSource === 'OPD_PEMKOT';
    return {
      actorType: isRskb ? 'ALUMNI_RSKB' : 'ALUMNI_STP',
      badgeLabel: isRskb
        ? `Alumni RSKB Surakarta${myAlumni?.programTaken ? ` • ${myAlumni.programTaken}` : ''}`
        : `Alumni Vokasi STP${myAlumni?.programTaken ? ` • ${myAlumni.programTaken}` : ''}`,
      displayName: myAlumni?.name || user?.displayName || 'Alumni Terverifikasi',
      portfolioEmbed: myAlumni?.id
        ? {
            alumniId: myAlumni.id,
            name: myAlumni.name,
            programTaken: myAlumni.programTaken,
            originSource: myAlumni.originSource,
            skills: myAlumni.skills || [],
            portfolioUrl: myAlumni.portfolioUrl,
            resumeUrl: myAlumni.resumeFileUrl || myAlumni.resumeUrl,
            reputationScore: myAlumni.forumReputationScore || 0,
          }
        : undefined,
    };
  }, [role, user, partnerProfile, partnerId, tenantProfile, tenantId, myAlumni]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!canEnterForum || !user) {
    return (
      <SectionContainer accent="emerald" width="narrow">
        <div className="public-card p-8 sm:p-12 text-center space-y-5 my-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Forum Eksklusif Alumni STP × RSKB Kota Surakarta
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Ruang jejaring berjenjang tempat Alumni Vokasi Solo Technopark & program Rumah Siap Kerja Bersama (RSKB) berbagi loker referral, bedah CV, menerima proyek mikro dari Startup Tenant, dan berdialog langsung dengan HRD Mitra Industri Resmi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <Link
                href="/profil"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Klaim Kode Alumni (AL / RSKB) di Profil
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Masuk Akun Alumni / Mitra Resmi
              </Link>
            )}
            <Link
              href="/kemitraan"
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" /> Daftar Sebagai Mitra Industri
            </Link>
          </div>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer accent="emerald" width="default">
      <PageHero
        breadcrumbs={[
          { label: 'Bursa Karir', href: '/karir' },
          { label: 'Forum Eksklusif Alumni & RSKB', href: '/alumni-portal' },
        ]}
        badge={{ label: 'Komunitas 2 Zona Terverifikasi', variant: 'emerald' }}
        title="Forum Eksklusif Alumni STP × RSKB"
        subtitle="Jejaring kolaborasi karir, bedah CV, loker referral, serta bursa proyek mikro bersama Mitra Industri Resmi & Startup Tenant Solo Technopark."
        accentColor="emerald"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari topik teknis, loker referral, proyek mikro, atau nama perusahaan..."
      />

      {/* Toolbar Filter Kejuruan & CTA Buat Topik */}
      <div className={selectedThread || isComposerOpen ? 'hidden' : 'public-filter-bar mb-6 flex flex-wrap items-center justify-between gap-3'}>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={vocationalTrack}
            onChange={(e) => setVocationalTrack(e.target.value)}
            className="public-select"
          >
            {VOCATIONAL_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <Link
            href="/karir"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Buka Bursa Karir</span>
          </Link>
        </div>

        <Button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 shadow-lg shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Topik / Proyek Baru</span>
        </Button>
      </div>

      {/* Layout 2 Kolom: Sidebar Zona A & B + Feed Diskusi */}
      <div className={selectedThread || isComposerOpen ? 'hidden' : 'flex flex-col lg:flex-row items-start gap-6'}>
        <ForumZoneSidebar
          role={role}
          uid={user.uid}
          activeChannel={activeChannel}
          onSelectChannel={setActiveChannel}
        />

        <div className="flex-1 w-full space-y-4">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Belum Ada Diskusi di Kanal Ini"
              description="Mulai percakapan perdana, bagikan info loker referral, atau buka peluang kolaborasi proyek mikro bersama rekan alumni STP & RSKB!"
              actionLabel="Mulai Topik Pertama"
              onAction={() => setIsComposerOpen(true)}
            />
          ) : (
            filteredThreads.map((thread) => (
              <ForumThreadCard
                key={thread.id}
                thread={thread}
                currentUid={user.uid}
                onOpenDetail={setSelectedThread}
                onUpvote={(t) => toggleUpvoteMutation.mutate({ thread: t, uid: user.uid })}
                onApplyProject={async (t) => {
                  const ok = await applyMicroProjectMutation.mutateAsync({
                    thread: t,
                    uid: user.uid,
                  });
                  if (ok) toast.success('Minat bergabung ke proyek berhasil tercatat! Balas utas untuk melampirkan Portofolio Anda.');
                }}
                onToggleRsvp={async (t) => {
                  await toggleRsvpMutation.mutateAsync({ thread: t, uid: user.uid });
                  toast.success('Status konfirmasi kehadiran (RSVP) diperbarui!');
                }}
              />
            ))
          )}
        </div>
      </div>

      <ForumThreadDetailModal
        thread={selectedThread}
        onClose={() => setSelectedThread(null)}
        currentUid={user.uid}
        currentName={actorIdentity.displayName}
        currentRole={role}
        actorType={actorIdentity.actorType}
        actorBadgeLabel={actorIdentity.badgeLabel}
        alumniId={myAlumni?.id}
        myPortfolioEmbed={actorIdentity.portfolioEmbed}
      />

      <CreateForumThreadModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        channels={visibleChannels}
        defaultChannelId={activeChannel === 'ALL' ? undefined : activeChannel}
        currentUid={user.uid}
        currentName={actorIdentity.displayName}
        actorType={actorIdentity.actorType}
        actorBadgeLabel={actorIdentity.badgeLabel}
        alumniId={myAlumni?.id}
        entityId={actorIdentity.entityId}
        myPortfolioEmbed={actorIdentity.portfolioEmbed}
        availableJobs={jobsRes?.jobs || []}
      />
    </SectionContainer>
  );
}

