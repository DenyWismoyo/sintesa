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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const room = await getAssetServerCached(id);

    if (!room) {
      return { title: 'Fasilitas Kawasan | KST Solo Technopark' };
    }

    const title = `${room.name} | Sewa Fasilitas KST Solo Technopark`;
    const description = room.description?.substring(0, 160) || `Sewa ${room.name} di Solo Technopark. Kapasitas ${room.capacity || 'fleksibel'} orang dengan fasilitas modern berstandar industri.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/fasilitas/${id}`,
        siteName: 'Solo Technopark',
        images: room.imageUrl ? [{ url: room.imageUrl, alt: room.name }] : [],
        locale: 'id_ID',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: room.imageUrl ? [room.imageUrl] : [],
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
