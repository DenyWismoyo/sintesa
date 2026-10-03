// Lokasi file: src/app/(public)/event/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import { getServerDocRest } from '@/lib/serverFirestore';
import { AppEvent } from '@/types/ecosystem.types';
import EventDetailClient from './ClientPage';

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 60;

const getEventServerCached = cache(async (id: string): Promise<AppEvent | null> => {
  return await getServerDocRest<AppEvent>('events', id, 60);
});

import { getSocialShareImageUrl } from '@/lib/imageUtils';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const event = await getEventServerCached(id);

    if (!event) {
      return { title: 'Agenda & Event | KST Solo Technopark' };
    }

    const title = `${event.title} | Event KST Solo Technopark`;
    const description = event.description?.substring(0, 160) || 'Ikuti agenda acara teknologi, lokakarya, dan pameran inovasi di Solo Technopark.';
    
    // Thumbnail ringan (<50KB) untuk share WhatsApp & Medsos
    const coverImageUrl = getSocialShareImageUrl(event.imageUrl);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/event/${id}`,
        siteName: 'Solo Technopark',
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: event.title,
          }
        ],
        locale: 'id_ID',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [coverImageUrl],
      }
    };
  } catch {
    return { title: 'Agenda & Event | KST Solo Technopark' };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const initialEvent = await getEventServerCached(id);

  return <EventDetailClient eventId={id} initialEvent={initialEvent} />;
}
