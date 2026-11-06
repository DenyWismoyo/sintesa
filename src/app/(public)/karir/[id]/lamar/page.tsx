// src/app/(public)/karir/[id]/lamar/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { jobDbService } from '@/services/jobDb.service';
import ApplyJobClient from './ApplyJobClient';
import { getSocialShareImageUrl } from '@/lib/imageUtils';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

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

  const title = `Lamar Pekerjaan: ${job.title} — ${job.company} | Solo Technopark`;
  const description = `Pilih saluran pendaftaran resmi atau ajukan rekomendasi penyaluran kerja untuk posisi ${job.title} di ${job.company}.`;

  const coverImageUrl = getSocialShareImageUrl(
    job.companyLogo,
    'https://katalog.solotechnopark.id/icon-katalog-stp.svg'
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/karir/${job.id}/lamar`,
      siteName: 'Solo Technopark',
      locale: 'id_ID',
      type: 'article',
      images: [
        {
          url: coverImageUrl,
          width: 800,
          height: 800,
          alt: `${job.title} - ${job.company}`,
        },
      ],
    },
  };
}

export default async function ApplyJobPage({ params }: PageProps) {
  const resolvedParams = await params;
  const idOrSlug = decodeURIComponent(resolvedParams.id);
  const job = await jobDbService.getJobById(idOrSlug);

  if (!job) {
    notFound();
  }

  return <ApplyJobClient idOrSlug={idOrSlug} initialJob={job} />;
}

