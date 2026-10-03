// Lokasi file: src/app/(public)/program-pelatihan/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClientPage from './ClientPage';
import { Training } from '@/types';

import { getServerDocRest } from '@/lib/serverFirestore';

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 60;

// Request deduplication dengan React.cache & Fast REST Fetch
const getTrainingServerCached = cache(async (id: string): Promise<Training | null> => {
  return await getServerDocRest<Training>('trainings', id, 60);
});

import { getSocialShareImageUrl } from '@/lib/imageUtils';

// FASE 1: SEO & Dynamic Open Graph untuk Detail Pelatihan
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const training = await getTrainingServerCached(id);

    if (!training) {
      return { title: 'Program Pelatihan | KST Solo Technopark' };
    }
    
    const title = `${training.title} | Pelatihan KST Solo Technopark`;
    const description = training.description?.substring(0, 160) || 'Ikuti pelatihan intensif dan tingkatkan keahlian Anda bersama KST Solo Technopark.';
    
    // Thumbnail cover pelatihan ringan (<50KB) untuk preview WhatsApp & Medsos
    const coverImageUrl = getSocialShareImageUrl(training.imageUrl);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/program-pelatihan/${training.id}`,
        siteName: 'Solo Technopark',
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: training.title,
          },
        ],
        locale: 'id_ID',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [coverImageUrl],
      },
      alternates: {
        canonical: `${APP_URL}/program-pelatihan/${training.id}`,
      }
    };
  } catch (error) {
    return { title: 'Program Pelatihan | KST Solo Technopark' };
  }
}

// FASE 2: JSON-LD Course Schema Injection & Hydration ke ClientPage
export default async function Page({ params }: Props) {
  const { id } = await params;
  const training = await getTrainingServerCached(id);

  let jsonLd = null;
  if (training) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: training.title,
      description: training.description,
      image: training.imageUrl || `${APP_URL}/placeholder-image.jpg`,
      provider: {
        '@type': 'Organization',
        name: 'Solo Technopark',
        sameAs: APP_URL
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: training.type === 'Offline' ? 'Onsite' : 'Online',
        courseWorkload: training.durationDisplay || 'PT10H',
      },
      offers: {
        '@type': 'Offer',
        category: training.isFree ? 'Free' : 'Paid',
        priceCurrency: 'IDR',
        price: training.isFree ? 0 : (training.price || 0),
      }
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ClientPage initialTraining={training} />
    </>
  );
}