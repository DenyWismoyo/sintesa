// Lokasi file: src/app/(public)/fasilitas/[id]/page.tsx

import { Metadata } from 'next';
import { cache } from 'react';
import { getServerDocRest } from '@/lib/serverFirestore';
import { Asset } from '@/types/asset.types';
import RoomDetailClient from './ClientPage';

type Props = {
  params: Promise<{ id: string }>
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 60;

const getAssetServerCached = cache(async (id: string): Promise<Asset | null> => {
  return await getServerDocRest<Asset>('assets', id, 60);
});

import { getSocialShareImageUrl } from '@/lib/imageUtils';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const room = await getAssetServerCached(id);

    if (!room) {
      return { title: 'Fasilitas Kawasan | KST Solo Technopark' };
    }

    const title = `${room.name} | Sewa Fasilitas KST Solo Technopark`;
    const description = room.description?.substring(0, 160) || `Sewa ${room.name} di Solo Technopark. Kapasitas ${room.capacity || 'fleksibel'} orang dengan fasilitas modern berstandar industri.`;
    
    // Thumbnail ringan (<50KB) agar lolos batas ukuran WhatsApp scraper
    const coverImageUrl = getSocialShareImageUrl(room.imageUrl);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/fasilitas/${id}`,
        siteName: 'Solo Technopark',
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: room.name,
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
    return { title: 'Fasilitas Kawasan | KST Solo Technopark' };
  }
}

export default async function RoomDetailPage({ params }: Props) {
  const { id } = await params;
  const initialRoom = await getAssetServerCached(id);

  return <RoomDetailClient roomId={id} initialRoom={initialRoom} />;
}
