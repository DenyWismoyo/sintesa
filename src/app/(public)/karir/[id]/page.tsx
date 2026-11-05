// src/app/(public)/karir/[id]/page.tsx
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { jobDbService } from '@/services/jobDb.service';
import JobDetailClient from './JobDetailClient';

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

  const title = `${job.title} — ${job.company} | Bursa Karir Solo Technopark`;
  const description = `${job.title} di ${job.company} (${job.location}). ${
    job.relevantTrainingPrograms.length > 0
      ? `Selaras dengan program diklat: ${job.relevantTrainingPrograms.join(', ')}. `
      : ''
  }Peluang karir resmi terverifikasi kawasan Solo Technopark.`;

  // Gambar thumbnail preview WhatsApp & Medsos (<50KB)
  const coverImageUrl = getSocialShareImageUrl(
    job.companyLogo,
    'https://katalog.solotechnopark.id/icon-katalog-stp.svg'
  );

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
      url: `${APP_URL}/karir/${job.id}`,
      siteName: 'Solo Technopark',
      locale: 'id_ID',
      type: 'article',
      images: [
        {
          url: coverImageUrl,
          width: 1200,
          height: 630,
          alt: `${job.title} di ${job.company}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImageUrl],
    },
    alternates: {
      canonical: `${APP_URL}/karir/${job.id}`,
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const idOrSlug = decodeURIComponent(resolvedParams.id);
  const job = await jobDbService.getJobById(idOrSlug);

  const jsonLd = job
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: new Date(job.postedAt || Date.now()).toISOString(),
        validThrough: new Date(
          job.deadlineAt || (job.postedAt || Date.now()) + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        employmentType:
          job.workType === 'Full-time'
            ? 'FULL_TIME'
            : job.workType === 'Internship / Magang'
            ? 'INTERN'
            : job.workType === 'Part-time'
            ? 'PART_TIME'
            : 'OTHER',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company,
          sameAs: job.companyWebsite || undefined,
          logo: job.companyLogo || undefined,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.city || 'Surakarta',
            addressCountry: 'ID',
          },
        },
        jobLocationType: job.workSetup === 'Remote / WFH' ? 'TELECOMMUTE' : undefined,
        baseSalary:
          job.salary?.isDisclosed && (job.salary?.min || job.salary?.max)
            ? {
                '@type': 'MonetaryAmount',
                currency: job.salary.currency || 'IDR',
                value: {
                  '@type': 'QuantitativeValue',
                  minValue: job.salary.min,
                  maxValue: job.salary.max,
                  unitText: job.salary.period === 'Tahun' ? 'YEAR' : 'MONTH',
                },
              }
            : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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
    </>
  );
}
