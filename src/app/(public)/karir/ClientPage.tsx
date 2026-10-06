// src/app/(public)/karir/ClientPage.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Briefcase, Sparkles, Building2, Search, GraduationCap } from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs, { PillTabItem } from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';
import { useJobs } from '@/hooks/useJobs';
import { JobListing, JobCategory } from '@/types/job.types';

import JobCard from './components/JobCard';
import JobDetailModal from './components/JobDetailModal';
import JobFilterToolbar from './components/JobFilterToolbar';
import AlumniQuickMatchBanner from './components/AlumniQuickMatchBanner';

const CATEGORY_TABS: PillTabItem[] = [
  { key: 'all', label: 'Semua Bidang' },
  { key: 'IT & Rekayasa Perangkat Lunak', label: 'IT & Software Dev' },
  { key: 'Kecerdasan Buatan & Sains Data', label: 'AI & Data Science' },
  { key: 'Manufaktur Presisi & Mekatronika', label: 'Manufaktur & CNC' },
  { key: 'Keamanan Siber (Cyber Security)', label: 'Cyber Security' },
  { key: 'Multimedia, Game & Animasi 3D', label: 'Multimedia & Game' },
  { key: 'Pemasaran & Bisnis Digital', label: 'Bisnis & E-Commerce' },
];

export default function KarirClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') || 'all');
  const [workType, setWorkType] = useState('all');
  const [workSetup, setWorkSetup] = useState('all');
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [trainingProgram, setTrainingProgram] = useState(searchParams.get('program') || '');
  const [isStpPartnerOnly, setIsStpPartnerOnly] = useState(false);
  const [sort, setSort] = useState('newest');

  // Modal State
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'detail' | 'ai-match'>('detail');

  // Query Filter Object
  const filterParams = useMemo(() => {
    return {
      query: searchQuery.trim() || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      workType: workType !== 'all' ? workType : undefined,
      workSetup: workSetup !== 'all' ? workSetup : undefined,
      experienceLevel: experienceLevel !== 'all' ? experienceLevel : undefined,
      trainingProgram: trainingProgram.trim() || undefined,
      isStpPartner: isStpPartnerOnly ? true : undefined,
      sort: sort as any,
    };
  }, [
    searchQuery,
    selectedCategory,
    workType,
    workSetup,
    experienceLevel,
    trainingProgram,
    isStpPartnerOnly,
    sort,
  ]);

  const { data, isLoading } = useJobs(filterParams);
  const jobs = data?.jobs || [];
  const total = data?.total || 0;

  // Auto-open modal jika URL memiliki query parameter `id`
  const initialJobId = searchParams.get('id');
  useEffect(() => {
    if (initialJobId && jobs.length > 0 && !selectedJob) {
      const match = jobs.find((j) => j.id === initialJobId || j.slug === initialJobId);
      if (match) {
        setSelectedJob(match);
        setIsModalOpen(true);
      }
    }
  }, [initialJobId, jobs, selectedJob]);

  const handleOpenDetail = (job: JobListing) => {
    setSelectedJob(job);
    setModalInitialTab('detail');
    setIsModalOpen(true);
  };

  const handleOpenAiMatch = (job: JobListing) => {
    setSelectedJob(job);
    setModalInitialTab('ai-match');
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setWorkType('all');
    setWorkSetup('all');
    setExperienceLevel('all');
    setTrainingProgram('');
    setIsStpPartnerOnly(false);
    setSort('newest');
  };

  return (
    <SectionContainer accent="emerald" width="default">
      {/* ─── Hero Section ─── */}
      <PageHero
        title="Bursa Karir & Talenta"
        subtitle="Peluang kerja, magang, dan penyaluran industri terkurasi khusus alumni pelatihan dan ekosistem inovasi Solo Technopark."
        accentColor="emerald"
        badge={{
          label: 'Talent & Career Hub STP',
          icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600" />,
        }}
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Pelatihan', href: '/program-pelatihan' },
          { label: 'Karir & Alumni' },
        ]}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari posisi pekerjaan, perusahaan mitra, atau keahlian (React, CNC, AI)..."
        isLoadingSearch={isLoading}
      />

      <div className="space-y-6 pt-4 sm:pt-6">
        {/* ─── Pill Tabs Kategori Bidang ─── */}
        <PillTabs
          tabs={CATEGORY_TABS}
          active={selectedCategory}
          onChange={setSelectedCategory}
        />

        {/* ─── Toolbar Filter & Relevansi Pelatihan ─── */}
        <JobFilterToolbar
          workType={workType}
          setWorkType={setWorkType}
          workSetup={workSetup}
          setWorkSetup={setWorkSetup}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          trainingProgram={trainingProgram}
          setTrainingProgram={setTrainingProgram}
          isStpPartnerOnly={isStpPartnerOnly}
          setIsStpPartnerOnly={setIsStpPartnerOnly}
          sort={sort}
          setSort={setSort}
          totalFound={total}
          onReset={handleResetFilters}
        />

        {/* ─── Grid Lowongan Kerja ─── */}
        {isLoading ? (
          <div className="public-grid-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="public-card h-80 rounded-2xl bg-white border border-slate-200/80 p-5 flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
                <div className="h-8 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Tidak Ada Lowongan yang Sesuai"
            description="Coba ubah kata kunci pencarian, sesuaikan filter kategori, atau reset filter untuk melihat seluruh peluang karir."
            actionLabel="Reset Semua Filter"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="public-grid-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={handleOpenDetail}
                onOpenAiMatch={handleOpenAiMatch}
                selectedProgramFilter={trainingProgram}
              />
            ))}
          </div>
        )}

        {/* ─── Banner Penyaluran Kerja Alumni STP ─── */}
        <div className="pt-6 sm:pt-8">
          <AlumniQuickMatchBanner />
        </div>
      </div>

      {/* ─── Modal Detail & Clario AI Matcher ─── */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTab={modalInitialTab}
      />
    </SectionContainer>
  );
}
