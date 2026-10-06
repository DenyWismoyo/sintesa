// src/app/(public)/karir/[id]/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { jobDbService } from '@/services/jobDb.service';
import JobDetailClient from './JobDetailClient';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const idOrSlug = decodeURIComponent(resolvedParams.id);
  const job = await jobDbService.getJobById(idOrSlug);

  if (!job) {
    return {
      title: 'Lowongan Tidak Ditemukan | Bursa Karir Solo Technopark',
      description: 'Lowongan pekerjaan yang Anda cari tidak ditemukan atau telah kedaluwarsa.',
    };
  }

  const title = `${job.title} di ${job.company} | Bursa Karir Solo Technopark`;
  const description = `${job.title} di ${job.company} (${job.location}). ${
    job.relevantTrainingPrograms.length > 0
      ? `Selaras dengan program diklat: ${job.relevantTrainingPrograms.join(', ')}.`
      : ''
  } Buka kesempatan karir resmi alumni Solo Technopark.`;

  return {
    title,
    description,
    keywords: [
      job.title,
      job.company,
      job.category,
      job.location,
      'Lowongan Kerja Solo Technopark',
      'Karir Alumni STP',
      ...job.skills,
    ],
    openGraph: {
      title,
      description,
      url: `https://solotechnopark.id/karir/${job.id}`,
      siteName: 'Solo Technopark',
      locale: 'id_ID',
      type: 'article',
      images: job.companyLogo ? [{ url: job.companyLogo }] : undefined,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const idOrSlug = decodeURIComponent(resolvedParams.id);

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Memuat rincian lowongan kerja...</p>
        </div>
      }
    >
      <JobDetailClient idOrSlug={idOrSlug} />
    </Suspense>
  );
}
